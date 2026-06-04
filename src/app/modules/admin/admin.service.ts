import { Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { JwtPayload } from 'jsonwebtoken';
import { AuthService } from '../auth/auth.service';
import { USER_ROLES } from '../../../enums/user';
import {
  IAuthResetPassword,
  IChangePassword,
  ILoginData,
  IVerifyEmail,
} from '../../../types/auth';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import generateOTP from '../../../utils/generateOTP';

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
  await ensureAdminUserByEmail(payload.email);

  const tokens = await AuthService.loginUserFromDB(payload);
  const admin = await User.findOne({ email: payload.email }).select(
    'name userName email role image verified isEmailVerified authProvider status'
  );

  return {
    ...tokens,
    admin,
  };
};

const adminForgetPasswordToDB = async (email: string) => {
  await ensureAdminUserByEmail(email);
  return AuthService.forgetPasswordToDB(email);
};

const adminVerifyResetOtpToDB = async (payload: IVerifyEmail) => {
  await ensureAdminUserByEmail(payload.email);
  return AuthService.verifyEmailToDB(payload);
};

const adminResetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword
) => {
  return AuthService.resetPasswordToDB(token, payload);
};

const adminResendOtpToDB = async (email: string) => {
  await ensureAdminUserByEmail(email);
  return AuthService.resendOtpFromDb(email, false);
};

const changePasswordForAdminInDB = async (
  admin: JwtPayload,
  payload: IChangePassword
) => {
  return AuthService.changePasswordToDB(admin, payload);
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
