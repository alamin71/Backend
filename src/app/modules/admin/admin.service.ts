import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { ResetToken } from '../resetToken/resetToken.model';
import { USER_ROLES } from '../../../enums/user';
import {
  IAuthResetPassword,
  IChangePassword,
  ILoginData,
  IVerifyEmail,
} from '../../../types/auth';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import generateOTP from '../../../utils/generateOTP';
import cryptoToken from '../../../utils/cryptoToken';

const ensureAdminUserByEmail = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role as any)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'This account is not authorized for admin operations'
    );
  }

  return user;
};

const createAdminToDB = async (payload: IUser): Promise<IUser> => {
  const createAdmin = await User.create(payload);
  if (!createAdmin) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
  }
  if (createAdmin) {
    await User.findByIdAndUpdate(
      { _id: createAdmin?._id },
      { verified: true },
      { new: true }
    );
  }
  return createAdmin;
};

const deleteAdminFromDB = async (id: string): Promise<IUser | undefined> => {
  const isExistAdmin = await User.findByIdAndDelete(id);
  if (!isExistAdmin) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
  }
  return;
};

const getAdminFromDB = async (): Promise<IUser[]> => {
  const admins = await User.find({ role: 'ADMIN' }).select(
    'name email profile location'
  );
  return admins;
};

// Get Admin Profile
const getAdminProfileFromDB = async (admin: JwtPayload) => {
  const adminData = await User.findById(admin.id);
  if (!adminData) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }
  return adminData;
};

// Update Admin Profile
const updateAdminProfileInDB = async (
  admin: JwtPayload,
  payload: Partial<IUser>
) => {
  // Prevent role change
  if ('role' in payload) {
    delete payload.role;
  }

  const updatedAdmin = await User.findByIdAndUpdate(admin.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedAdmin) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }

  return updatedAdmin;
};

const adminLoginToDB = async (payload: ILoginData) => {
  const { email, password } = payload;
  const isExistUser = await User.findOne({ email }).select('+password');
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }
  await ensureAdminUserByEmail(email);

  if (isExistUser.status === 'blocked') {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked.');
  }

  if (!(await User.isMatchPassword(password, isExistUser.password ?? ''))) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
  }

  const jwtData = {
    id: isExistUser._id,
    role: isExistUser.role,
    email: isExistUser.email,
  };

  const accessToken = jwtHelper.createToken(
    jwtData,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );
  const refreshToken = jwtHelper.createToken(
    jwtData,
    config.jwt.jwt_refresh_secret as Secret,
    config.jwt.jwt_refresh_expire_in as string
  );

  return {
    accessToken,
    refreshToken,
    admin: {
      id: isExistUser._id,
      name: isExistUser.name,
      email: isExistUser.email,
      role: isExistUser.role,
      image: isExistUser.image,
    },
  };
};

const adminForgetPasswordToDB = async (email: string) => {
  await ensureAdminUserByEmail(email);

  const otp = generateOTP(6);
  const value = { otp, email };
  const forgetPassword = emailTemplate.resetPassword(value);
  emailHelper.sendEmail(forgetPassword);

  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        authentication: {
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + 5 * 60000),
        },
      },
    }
  );

  return { otp };
};

const adminVerifyResetOtpToDB = async (payload: IVerifyEmail) => {
  const { email, oneTimeCode } = payload;
  await ensureAdminUserByEmail(email);

  const isExistUser = await User.findOne({ email }).select('+authentication');
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const dbOtp = String(isExistUser.authentication?.oneTimeCode);
  const requestOtp = String(oneTimeCode);

  if (dbOtp !== requestOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You provided wrong OTP');
  }

  const expireAt = isExistUser.authentication?.expireAt;
  if (!expireAt || new Date() > expireAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP already expired, please try again');
  }

  await User.findOneAndUpdate(
    { _id: isExistUser._id },
    {
      authentication: {
        isResetPassword: true,
        oneTimeCode: null,
        expireAt: null,
      },
    }
  );

  const resetToken = cryptoToken();
  await ResetToken.create({
    user: isExistUser._id,
    token: resetToken,
    expireAt: new Date(Date.now() + 5 * 60000),
  });

  return {
    verifyToken: resetToken,
    message: 'OTP verified successfully. Use the reset token to reset your password.',
  };
};

const adminResetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword
) => {
  const { newPassword, confirmPassword } = payload;

  const isExistToken = await ResetToken.isExistToken(token);
  if (!isExistToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
  }

  const isExistUser = await User.findById(isExistToken.user).select('+authentication');
  if (!isExistUser?.authentication?.isResetPassword) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "You don't have permission to change the password. Please click 'Forgot Password' again."
    );
  }

  const isValid = await ResetToken.isExpireToken(token);
  if (!isValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Token expired, please request a new one');
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "New password and Confirm password don't match!");
  }

  const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

  await User.findOneAndUpdate(
    { _id: isExistToken.user },
    { password: hashPassword, authentication: { isResetPassword: false } },
    { new: true }
  );
};

const adminResendOtpToDB = async (email: string) => {
  await ensureAdminUserByEmail(email);

  const otp = generateOTP(6);
  const value = { otp, email };
  const mail = emailTemplate.resetPassword(value);
  emailHelper.sendEmail(mail);

  await User.findOneAndUpdate(
    { email },
    {
      $set: {
        authentication: {
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + 5 * 60000),
        },
      },
    }
  );

  const otpToken = jwtHelper.createToken(
    { email },
    config.jwt.jwt_secret as Secret,
    '10m'
  );

  return { otp, otpToken };
};

const changePasswordForAdminInDB = async (
  admin: JwtPayload,
  payload: IChangePassword
) => {
  const { currentPassword, newPassword, confirmPassword } = payload;
  const isExistUser = await User.findById(admin.id).select('+password');
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (!isExistUser.password || !(await User.isMatchPassword(currentPassword, isExistUser.password))) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Current password is incorrect');
  }

  if (currentPassword === newPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'New password must differ from current password');
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, "New password and Confirm password don't match");
  }

  const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));
  await User.findOneAndUpdate({ _id: admin.id }, { password: hashPassword }, { new: true });
};
const removeProfilePhotoFromDB = async (admin: JwtPayload) => {
  const updatedAdmin = await User.findByIdAndUpdate(
    admin.id,
    { profileImage: '' },
    { new: true, runValidators: true }
  );

  if (!updatedAdmin) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }

  return updatedAdmin;
};

const requestEmailChangeToDB = async (admin: JwtPayload, newEmail: string) => {
  const normalizedNewEmail = newEmail.trim().toLowerCase();

  const adminData = await User.findById(admin.id);
  if (!adminData) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }

  const existingUser = await User.findOne({ email: normalizedNewEmail });
  if (existingUser && existingUser._id.toString() !== admin.id) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Email already in use');
  }

  if (normalizedNewEmail === adminData.email) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'New email cannot be the same as current email'
    );
  }

  const otp = generateOTP(6);

  const emailChangeTemplate = emailTemplate.emailChangeOtp({
    name: adminData.name,
    otp,
    newEmail: normalizedNewEmail,
  });
  await emailHelper.sendEmail(emailChangeTemplate);

  const authentication = {
    ...adminData.authentication,
    pendingEmail: normalizedNewEmail,
    emailChangeOtp: otp,
    emailChangeExpireAt: new Date(Date.now() + 5 * 60000),
  };

  await User.findByIdAndUpdate(admin.id, { authentication });

  return {
    otp,
    message: `OTP sent to ${normalizedNewEmail}`,
  };
};

const verifyEmailChangeOtpToDB = async (admin: JwtPayload, otp: number) => {
  const adminData = await User.findById(admin.id).select('+authentication');
  if (!adminData) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }

  const authentication = adminData.authentication;

  if (!authentication?.pendingEmail) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'No email change request found'
    );
  }

  if (!otp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP is required');
  }

  const dbOtp = String(authentication?.emailChangeOtp);
  const requestOtp = String(otp);

  if (dbOtp !== requestOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  const expireAt = authentication?.emailChangeExpireAt;
  if (!expireAt) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OTP already expired, please request again'
    );
  }

  const date = new Date();
  if (date > expireAt) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'OTP already expired, please request again'
    );
  }

  const updatedAdmin = await User.findByIdAndUpdate(
    admin.id,
    {
      email: authentication.pendingEmail,
      authentication: {
        isResetPassword: false,
        oneTimeCode: null,
        expireAt: null,
        pendingEmail: '',
        emailChangeOtp: null,
        emailChangeExpireAt: null,
      },
    },
    { new: true }
  );

  return {
    email: updatedAdmin?.email,
    message: 'OTP verified and email changed successfully',
  };
};

export const AdminService = {
  createAdminToDB,
  deleteAdminFromDB,
  getAdminFromDB,
  getAdminProfileFromDB,
  updateAdminProfileInDB,
  adminLoginToDB,
  adminForgetPasswordToDB,
  adminVerifyResetOtpToDB,
  adminResetPasswordToDB,
  adminResendOtpToDB,
  changePasswordForAdminInDB,
  removeProfilePhotoFromDB,
  requestEmailChangeToDB,
  verifyEmailChangeOtpToDB,
};
