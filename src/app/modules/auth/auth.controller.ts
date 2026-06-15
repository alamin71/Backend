import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';

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
  const result = await AuthService.verifyOtpLoginToDB(req.body);
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
