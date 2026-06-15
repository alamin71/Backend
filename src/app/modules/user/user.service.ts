import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
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
  const isPasswordValid = await User.isMatchPassword(password, userPassword);
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

const deleteUserWithOtpFromDB = async (
  userId: string,
  oneTimeCode: number
) => {
  const user = await User.findById(userId).select('+authentication');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User doesn't exist!");
  }

  const dbOtp = String(user.authentication?.oneTimeCode);
  const requestOtp = String(oneTimeCode);

  if (dbOtp !== requestOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You provided wrong OTP');
  }

  const expireAt = user.authentication?.expireAt;
  if (!expireAt || new Date() > expireAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP expired, please try again');
  }

  await User.findByIdAndUpdate(userId, {
    $set: { isDeleted: true, authentication: { oneTimeCode: null, expireAt: null } },
  });

  return true;
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  verifyUserPassword,
  sendDeleteAccountOtpToDB,
  deleteUserWithOtpFromDB,
};
