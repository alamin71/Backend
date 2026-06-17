import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import { uploadToS3 } from '../../../helpers/s3Helper';
import AppError from '../../../errors/AppError';
const createUser = catchAsync(async (req, res) => {
  const { ...userData } = req.body;
  const result = await UserService.createUserToDB(userData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User created successfully',
    data: result,
  });
});

const getUserProfile = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(async (req, res) => {
  const user = req.user;
  let payload = { ...req.body };

  if (typeof payload?.data === 'string') {
    try {
      payload = {
        ...payload,
        ...JSON.parse(payload.data),
      };
      delete payload.data;
    } catch (error) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid profile data');
    }
  }

  const files = req.files as
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  let imageFile: Express.Multer.File | undefined;

  if (Array.isArray(files) && files.length > 0) {
    imageFile = files.find((file) => file.fieldname === 'image');
  } else if (files) {
    if ('image' in files && Array.isArray(files.image)) {
      [imageFile] = files.image;
    }
  }

  if (imageFile) {
    const s3Url = await uploadToS3(imageFile, 'user/profiles');
    payload.image = s3Url;
  }

  // Protect sensitive fields from being updated via this endpoint
  const protectedFields = ['role', 'password', 'email', 'verified', 'status', 'isDeleted'];
  protectedFields.forEach((field) => delete payload[field]);

  const result = await UserService.updateProfileToDB(user, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});
// Send OTP for account deletion
const sendDeleteOtp = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await UserService.sendDeleteAccountOtpToDB(id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OTP sent to your email for account deletion.',
    data: result,
  });
});

// Step 2: Verify OTP → return deleteToken
const verifyDeleteOtp = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { otp } = req.body;
  const result = await UserService.verifyDeleteOtpFromDB(id, Number(otp));
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'OTP verified. Proceed with account deletion.',
    data: result,
  });
});

// Step 3: Delete account with deleteToken + reason
const deleteProfile = catchAsync(async (req, res) => {
  const deleteToken = req.headers['delete-token'] as string;
  if (!deleteToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Delete token is required');
  }
  const { reason } = req.body;
  await UserService.deleteUserWithTokenFromDB(deleteToken, reason);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Account deleted successfully.',
    data: null,
  });
});

const requestEmailChange = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { newEmail } = req.body;
  const result = await UserService.requestEmailChangeToDB(id, newEmail);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: { otp: result.otp },
  });
});

const verifyEmailChangeOtp = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { otp } = req.body;
  const result = await UserService.verifyEmailChangeOtpToDB(id, Number(otp));
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: { email: result.email },
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  sendDeleteOtp,
  verifyDeleteOtp,
  deleteProfile,
  requestEmailChange,
  verifyEmailChangeOtp,
};
