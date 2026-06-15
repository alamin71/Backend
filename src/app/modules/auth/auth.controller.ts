import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import AppError from '../../../errors/AppError';

const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.sendOtpToDB(req.body.email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent to your email.',
    data: result,
  });
});

const verifyOtpLogin = catchAsync(async (req: Request, res: Response) => {
  const otpToken =
    (req.headers['signup-token'] as string) ||
    req.headers.authorization?.split(' ')[1];
  if (!otpToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'OTP token is required');
  }

  let decoded;
  try {
    decoded = jwtHelper.verifyToken(otpToken, config.jwt.jwt_secret as Secret);
  } catch {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired OTP token');
  }

  const result = await AuthService.verifyOtpLoginToDB({
    email: decoded.email as string,
    oneTimeCode: req.body.otp,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Login successful.',
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.resendOtpFromDb(req.body.email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP resent to your email.',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers['x-refresh-token'] as string;
  const result = await AuthService.refreshToken(token);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Access token refreshed.',
    data: result,
  });
});

const guestLogin = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.guestLoginToDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Guest login successful.',
    data: result,
  });
});

export const AuthController = {
  sendOtp,
  verifyOtpLogin,
  resendOtp,
  refreshToken,
  guestLogin,
};
