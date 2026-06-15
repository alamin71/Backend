import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { IVerifyEmail } from '../../../types/auth';
import { User } from '../user/user.model';
import { Guest } from '../guest/guest.model';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';
import { verifyToken } from '../../../utils/verifyToken';

// Send OTP → creates user if first time, updates OTP if returning user
const sendOtpToDB = async (email: string) => {
  const existingUser = await User.findOne({ email });

  if (existingUser?.status === USER_STATUS.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked');
  }

  const otp = generateOTP(6);
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60000),
  };

  const generatedName = email.split('@')[0] || 'User';
  const generatedUserName = email.split('@')[1] || '';

  // $setOnInsert only runs on first-time user creation
  await User.findOneAndUpdate(
    { email },
    {
      $setOnInsert: {
        name: generatedName,
        userName: generatedUserName,
        email,
        role: USER_ROLES.USER,
        status: USER_STATUS.ACTIVE,
        verified: false,
      },
      $set: { authentication },
    },
    { upsert: true }
  );

  const emailData = {
    name: existingUser?.name || generatedName,
    otp,
    email,
  };
  const template = emailTemplate.createAccount(emailData as any);
  emailHelper.sendEmail(template);

  const otpToken = jwtHelper.createToken(
    { email, purpose: 'otp-login' },
    config.jwt.jwt_secret as Secret,
    '10m'
  );

  return { otp, otpToken };
};

// Verify OTP → login (first time: activates user, returning: just logs in)
const verifyOtpLoginToDB = async (payload: IVerifyEmail) => {
  const { email, oneTimeCode } = payload;

  const user = await User.findOne({ email }).select('+authentication');
  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked');
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

  await User.findByIdAndUpdate(user._id, {
    $set: {
      verified: true,
      authentication: { isResetPassword: false, oneTimeCode: null, expireAt: null },
    },
  });

  const jwtData = {
    id: user._id,
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const accessToken = jwtHelper.createToken(
    jwtData,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );
  const refreshToken = jwtHelper.createToken(
    jwtData,
    config.jwt.jwt_refresh_secret as string,
    config.jwt.jwt_refresh_expire_in as string
  );

  const userData = await User.findById(user._id).select(
    'name userName email role image status verified'
  );

  return { accessToken, refreshToken, user: userData };
};

// Resend OTP
const resendOtpFromDb = async (email: string) => {
  const isExistUser = await User.isExistUserByEmail(email);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const otp = generateOTP(6);
  const values = {
    name: isExistUser.name,
    otp,
    email: isExistUser.email!,
  };
  const template = emailTemplate.createAccount(values);
  emailHelper.sendEmail(template);

  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 5 * 60000),
  };
  await User.findOneAndUpdate(
    { email: isExistUser.email },
    { $set: { authentication } }
  );

  const otpToken = jwtHelper.createToken(
    { email: isExistUser.email },
    config.jwt.jwt_secret as Secret,
    '10m'
  );

  return { otp, otpToken };
};

// Refresh access token
const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Token not found');
  }

  const decoded = verifyToken(token, config.jwt.jwt_refresh_secret as string);
  const { id } = decoded;

  const activeUser = await User.findById(id);
  if (!activeUser) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (activeUser.status !== 'active') {
    throw new AppError(StatusCodes.FORBIDDEN, 'User account is inactive');
  }
  if (!activeUser.verified) {
    throw new AppError(StatusCodes.FORBIDDEN, 'User account is not verified');
  }
  if (activeUser.isDeleted) {
    throw new AppError(StatusCodes.FORBIDDEN, 'User account is deleted');
  }

  const jwtPayload = {
    id: activeUser._id?.toString() as string,
    role: activeUser.role,
    email: activeUser.email,
  };

  const accessToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  return { accessToken };
};

// Guest login
const guestLoginToDB = async (payload: { deviceId: string }) => {
  const { deviceId } = payload;
  if (!deviceId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Device ID is required');
  }

  let guest = await Guest.findOne({ deviceId });
  if (!guest) {
    guest = await Guest.create({ deviceId });
  }

  const jwtData = {
    id: guest._id,
    role: USER_ROLES.GUEST,
    deviceId: guest.deviceId,
  } as any;

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

  return { accessToken, refreshToken, guest };
};

export const AuthService = {
  sendOtpToDB,
  verifyOtpLoginToDB,
  resendOtpFromDb,
  refreshToken,
  guestLoginToDB,
};
