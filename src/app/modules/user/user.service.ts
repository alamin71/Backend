import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from './user.interface';
import { User } from './user.model';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';
// create user
const createUserToDB = async (payload: IUser): Promise<IUser> => {
  //set role
  const user = await User.isExistUserByEmail(payload.email);
  if (user) {
    throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
  }
  payload.role = USER_ROLES.USER;
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  //send email
  const otp = generateOTP(6);
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } }
  );

  return createUser;
};
// create Admin
// const createAdminToDB = async (
//   payload: Partial<IUser>
// ): Promise<IUser> => {
//   //set role
//   payload.role = USER_ROLES.ADMIN;
//   const createAdmin = await User.create(payload);
//   if (!createAdmin) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin');
//   }

//   //send email
//   const otp = generateOTP(6);
//   const values = {
//     name: createAdmin.name,
//     otp: otp,
//     email: createAdmin.email!,
//   };
//   const createAccountTemplate = emailTemplate.createAccount(values);
//   emailHelper.sendEmail(createAccountTemplate);

//   //save to DB
//   const authentication = {
//     oneTimeCode: otp,
//     expireAt: new Date(Date.now() + 3 * 60000),
//   };
//   await User.findOneAndUpdate(
//     { _id: createAdmin._id },
//     { $set: { authentication } }
//   );

//   return createAdmin;
// };

// get user profile
const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

// update user profile
const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (
    payload.image &&
    isExistUser.image &&
    !isExistUser.image.startsWith('http://') &&
    !isExistUser.image.startsWith('https://')
  ) {
    unlinkFile(isExistUser.image);
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const verifyUserPassword = async (userId: string, password: string) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
  }
  const userPassword = user.password ?? '';
  const isPasswordValid = User.isMatchPassword(password, userPassword);
  return isPasswordValid;
};
const sendDeleteAccountOtpToDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  const otp = generateOTP(6);
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60000),
  };

  await User.findByIdAndUpdate(userId, { $set: { authentication } });

  const emailData = { name: user.name, otp, email: user.email };
  const template = emailTemplate.createAccount(emailData as any);
  emailHelper.sendEmail(template);

  return { otp, email: user.email };
};

// Step 2: Verify OTP → return deleteToken (identity confirmed, not deleted yet)
const verifyDeleteOtpFromDB = async (userId: string, oneTimeCode: number) => {
  const user = await User.findById(userId).select('+authentication');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  const dbOtp = String(user.authentication?.oneTimeCode);
  if (dbOtp !== String(oneTimeCode)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You provided wrong OTP');
  }

  const expireAt = user.authentication?.expireAt;
  if (!expireAt || new Date() > expireAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP expired, please try again');
  }

  // Clear OTP after verification
  await User.findByIdAndUpdate(userId, {
    $set: { authentication: { oneTimeCode: null, expireAt: null } },
  });

  // Return short-lived delete token (5 min)
  const deleteToken = jwtHelper.createToken(
    { id: userId, purpose: 'delete-account' },
    config.jwt.jwt_secret as Secret,
    '5m'
  );

  return { deleteToken };
};

// Step 3: Submit reason + delete account (requires deleteToken)
const deleteUserWithTokenFromDB = async (
  deleteToken: string,
  _reason?: string
) => {
  let decoded;
  try {
    decoded = jwtHelper.verifyToken(deleteToken, config.jwt.jwt_secret as Secret);
  } catch {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired delete token');
  }

  if (decoded.purpose !== 'delete-account') {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token purpose');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  await User.findByIdAndUpdate(decoded.id, {
    $set: { isDeleted: true },
  });

  return true;
};

// Request email change → send OTP to new email
const requestEmailChangeToDB = async (userId: string, newEmail: string) => {
  const normalizedEmail = newEmail.trim().toLowerCase();

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  if (normalizedEmail === user.email) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'New email cannot be same as current email');
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'This email is already in use');
  }

  const otp = generateOTP(6);
  const emailChangeTemplate = emailTemplate.emailChangeOtp({
    name: user.name,
    otp,
    newEmail: normalizedEmail,
  });
  await emailHelper.sendEmail(emailChangeTemplate);

  await User.findByIdAndUpdate(userId, {
    authentication: {
      ...user.authentication,
      pendingEmail: normalizedEmail,
      emailChangeOtp: otp,
      emailChangeExpireAt: new Date(Date.now() + 5 * 60000),
    },
  });

  return { otp, message: `OTP sent to ${normalizedEmail}` };
};

// Verify OTP → update email
const verifyEmailChangeOtpToDB = async (userId: string, otp: number) => {
  const user = await User.findById(userId).select('+authentication');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  const auth = user.authentication;

  if (!auth?.pendingEmail) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'No email change request found');
  }

  if (String(auth.emailChangeOtp) !== String(otp)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  const expireAt = auth.emailChangeExpireAt;
  if (!expireAt || new Date() > expireAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP expired, please request again');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      email: auth.pendingEmail,
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

  return { email: updatedUser?.email, message: 'Email changed successfully' };
};

const getSubscriptionStatusFromDB = async (userId: string) => {
  const user = await User.findById(userId).select('userType subscriptionExpireAt');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  const now = new Date();
  const isActive =
    user.userType === 'pro' &&
    (user.subscriptionExpireAt === null || user.subscriptionExpireAt > now);

  return {
    userType: user.userType,
    isActive,
    subscriptionExpireAt: user.subscriptionExpireAt ?? null,
  };
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  verifyUserPassword,
  sendDeleteAccountOtpToDB,
  verifyDeleteOtpFromDB,
  deleteUserWithTokenFromDB,
  requestEmailChangeToDB,
  verifyEmailChangeOtpToDB,
  getSubscriptionStatusFromDB,
};
