import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';

const signupUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.signupUserToDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent to your email. Please verify to complete signup.',
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUserFromDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent to your email. Please verify to login.',
    data: result,
  });
});

const verifyLoginOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyLoginOtpToDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Login successful.',
    data: result,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.verifyEmailToDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.forgetPasswordToDB(req.body.email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent to your email for password reset.',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1] as string;
  const result = await AuthService.resetPasswordToDB(token, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successful.',
    data: result,
  });
});

const forgetPasswordByUrl = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgetPasswordByUrlToDB(req.body.email);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset link sent to your email.',
    data: null,
  });
});

const resetPasswordByUrl = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1] as string;
  const result = await AuthService.resetPasswordByUrl(token, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successful.',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.changePasswordToDB(req.user, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password changed successfully.',
    data: result,
  });
});

const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.resendOtpFromDb(email);
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

// Passwordless OTP flow
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

export const AuthController = {
  signupUser,
  loginUser,
  verifyLoginOtp,
  verifyOtp,
  forgetPassword,
  resetPassword,
  forgetPasswordByUrl,
  resetPasswordByUrl,
  changePassword,
  resendOtp,
  refreshToken,
  guestLogin,
  sendOtp,
  verifyOtpLogin,
};
