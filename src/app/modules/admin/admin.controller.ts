import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminService } from './admin.service';
import { uploadToS3 } from '../../../helpers/s3Helper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import AppError from '../../../errors/AppError';

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AdminService.createAdminToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin created Successfully',
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.params.id;
  const result = await AdminService.deleteAdminFromDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin Deleted Successfully',
    data: result,
  });
});

const getAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAdminFromDB();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin Retrieved Successfully',
    data: result,
  });
});

// Get Admin Profile
const getAdminProfile = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user;
  const result = await AdminService.getAdminProfileFromDB(admin);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin profile retrieved successfully',
    data: result,
  });
});

// Update Admin Profile
const updateAdminProfile = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user;
  const payload = { ...req.body };

  // Upload image to S3 if file was uploaded
  const files = req.files as
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  let imageFile: Express.Multer.File | undefined;

  if (Array.isArray(files) && files.length > 0) {
    imageFile = files.find((file) => file.fieldname === 'image');
  } else if (files && 'image' in files && Array.isArray(files.image)) {
    [imageFile] = files.image;
  }

  if (imageFile) {
    const s3Url = await uploadToS3(imageFile, 'admin/profiles');
    payload.image = s3Url;
  }

  const result = await AdminService.updateAdminProfileInDB(admin, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin profile updated successfully',
    data: result,
  });
});

const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await AdminService.adminLoginToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin logged in successfully',
    data: result,
  });
});

const adminForgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AdminService.adminForgetPasswordToDB(email);
  const otpToken = jwtHelper.createToken(
    { email },
    config.jwt.jwt_secret as Secret,
    '10m'
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result?.otp
      ? `OTP sent to admin email. [DEV: ${result.otp}]`
      : 'OTP sent to admin email',
    data: {
      ...result,
      otpToken,
    },
  });
});

const adminVerifyResetOtp = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  const otpToken =
    (req.headers['otp-token'] as string) ||
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

  const payload = {
    email,
    oneTimeCode: Number(otp),
  };

  const result = await AdminService.adminVerifyResetOtpToDB(payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || 'Admin OTP verified successfully',
    data: { resetToken: result.verifyToken },
  });
});

const adminResetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers['reset-token'] as string;
  const payload = req.body;
  const result = await AdminService.adminResetPasswordToDB(token, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin password reset successfully',
    data: result,
  });
});

const adminResendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AdminService.adminResendOtpToDB(email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result?.otp
      ? `Admin OTP resent successfully. [DEV: ${result.otp}]`
      : 'Admin OTP resent successfully',
    data: result,
  });
});

// Change Password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user;
  const payload = req.body;
  const result = await AdminService.changePasswordForAdminInDB(admin, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});
// Remove Profile Photo
const removeProfilePhoto = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user;
  const result = await AdminService.removeProfilePhotoFromDB(admin);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile photo removed successfully',
    data: result,
  });
});

// Request Email Change
const requestEmailChange = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user;
  const { newEmail } = req.body;
  const result = await AdminService.requestEmailChangeToDB(admin, newEmail);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: {
      otp: result.otp ? `[DEV: ${result.otp}]` : undefined,
    },
  });
});

// Verify Email Change OTP
const verifyEmailChangeOtp = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user;
  const { otp } = req.body;
  const result = await AdminService.verifyEmailChangeOtpToDB(admin, otp);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const AdminController = {
  deleteAdmin,
  createAdmin,
  getAdmin,
  getAdminProfile,
  updateAdminProfile,
  adminLogin,
  adminForgetPassword,
  adminVerifyResetOtp,
  adminResetPassword,
  adminResendOtp,
  changePassword,
  removeProfilePhoto,
  requestEmailChange,
  verifyEmailChangeOtp,
};
