import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import config from '../../../config';
import AppError from '../../../errors/AppError';
import { jwtHelper } from '../../../helpers/jwtHelper';

const extractEmailFromOtpToken = (req: Request) => {
  const otpToken =
    (req.headers['otp-token'] as string) ||
    (req.headers['signup-token'] as string) ||
    ((req.headers.authorization as string)?.split(' ')[1] as string);

  if (!otpToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'OTP token is required');
  }

  let decoded;
  try {
    decoded = jwtHelper.verifyToken(otpToken, config.jwt.jwt_secret as Secret);
  } catch (error) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'Invalid or expired OTP token'
    );
  }

  const email = decoded?.email as string | undefined;
  if (!email) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid OTP token payload');
  }

  return email;
};

const signupUser = catchAsync(async (req, res) => {
  const payload = req.body;
  const result = await AuthService.signupUserToDB(payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result?.otp
      ? `Signup OTP sent. [DEV: ${result.otp}]`
      : 'Signup OTP sent to your email. Please verify to activate your account.',
    data: result,
  });
});

const loginUser = catchAsync(async (req, res) => {
  const { ...loginData } = req.body;
  const result = await AuthService.loginUserFromDB(loginData);
  const cookieOptions: {
    secure: boolean;
    httpOnly: boolean;
    maxAge: number;
    sameSite?: 'none' | 'lax' | 'strict';
  } = {
    secure: false,
    httpOnly: true,
    maxAge: 31536000000,
  };

  if (config.node_env === 'production') {
    cookieOptions.sameSite = 'none';
  }
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logged in successfully.',
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const email = req.body.email;
  const result = await AuthService.forgetPasswordToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result?.otp
      ? `OTP sent to email. [DEV: ${result.otp}]`
      : 'Please check your email. We have sent you a one-time passcode (OTP).',
    data: result,
  });
});
const forgetPasswordByUrl = catchAsync(async (req, res) => {
  const email = req.body.email;

  // Call the service function
  await AuthService.forgetPasswordByUrlToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Please check your email. We have sent you a password reset link.',
    data: {},
  });
});

const resetPasswordByUrl = catchAsync(async (req, res) => {
  let token = req?.headers?.authorization?.split(' ')[1];
  const { ...resetData } = req.body;

  const result = await AuthService.resetPasswordByUrl(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully reset.',
    data: result,
  });
});
const resetPassword = catchAsync(async (req, res) => {
  const token = req.headers['reset-token'] as string;
  const { ...resetData } = req.body;
  const result = await AuthService.resetPasswordToDB(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully reset.',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = req.user;
  const { ...passwordData } = req.body;
  const result = await AuthService.changePasswordToDB(user, passwordData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your password has been successfully changed',
    data: result,
  });
});

// verify OTP
const verifyOtp = catchAsync(async (req, res) => {
  const { otp } = req.body;
  const email = extractEmailFromOtpToken(req);

  const result = await AuthService.verifyEmailToDB({
    email,
    oneTimeCode: Number(otp),
  });

  // Format response based on context (signup vs reset)
  const responseData = result.verifyToken
    ? { resetToken: result.verifyToken }
    : { user: result.user };

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: responseData,
  });
});

// resend Otp
const resendOtp = catchAsync(async (req, res) => {
  const signupToken = req.headers['signup-token'] as string;
  const { email } = req.body;

  if (!signupToken && !email) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Email is required when signup-token is not provided'
    );
  }

  // Use token if provided, otherwise use email from body
  const result = signupToken
    ? await AuthService.resendOtpFromDb(signupToken, true)
    : await AuthService.resendOtpFromDb(email, false);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result?.otp
      ? `OTP resent successfully. [DEV: ${result.otp}]`
      : 'OTP sent successfully again',
    data: result,
  });
});

// refresh token
const refreshToken = catchAsync(async (req, res) => {
  const refreshToken = req.headers?.refreshtoken as string;
  const result = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Access token retrieved successfully',
    data: result,
  });
});
export const AuthController = {
  signupUser,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  verifyOtp,
  // forgetPasswordByUrl,  // URL-based (commented for future use)
  // resetPasswordByUrl,   // URL-based (commented for future use)
  resendOtp,
  refreshToken,
};
