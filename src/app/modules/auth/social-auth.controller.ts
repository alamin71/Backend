import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import AppError from '../../../errors/AppError';
import { SocialAuthService } from './social-auth.service';

const googleSignIn = catchAsync(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError(StatusCodes.BAD_REQUEST, 'idToken is required');

  const result = await SocialAuthService.googleSignInToDB(idToken);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Google sign-in successful',
    data: result,
  });
});

const appleSignIn = catchAsync(async (req, res) => {
  const { identityToken, fullName } = req.body;
  if (!identityToken) throw new AppError(StatusCodes.BAD_REQUEST, 'identityToken is required');

  const result = await SocialAuthService.appleSignInToDB(identityToken, fullName);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Apple sign-in successful',
    data: result,
  });
});

export const SocialAuthController = { googleSignIn, appleSignIn };
