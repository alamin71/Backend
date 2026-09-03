import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GuestUpgradeService } from './guest-upgrade.service';
import { jwtHelper } from '../../../helpers/jwtHelper';
import config from '../../../config';
import AppError from '../../../errors/AppError';

// Step 1 — Guest sends email + name + userName → receives otpToken
const requestUpgrade = catchAsync(async (req, res) => {
  const { email, name, userName } = req.body;
  const guestId = req.user.id;

  const result = await GuestUpgradeService.requestUpgrade(guestId, { email, name, userName });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP sent to your email. Please verify to complete account setup.',
    data: result,
  });
});

// Step 2 — Guest sends otp (via otpToken header) → account created + sessions migrated
const verifyUpgrade = catchAsync(async (req, res) => {
  const otpToken =
    (req.headers['otp-token'] as string) ||
    req.headers.authorization?.split(' ')[1];

  if (!otpToken) throw new AppError(StatusCodes.UNAUTHORIZED, 'OTP token is required');

  let decoded: any;
  try {
    decoded = jwtHelper.verifyToken(otpToken, config.jwt.jwt_secret as Secret);
  } catch {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired OTP token');
  }

  if (decoded.purpose !== 'guest-upgrade') {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid token purpose');
  }

  const result = await GuestUpgradeService.verifyUpgrade(decoded.guestId, req.body.otp);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Account created successfully! Your activity has been saved.',
    data: result,
  });
});

// Update guest name/username (before upgrade)
const updateGuestProfile = catchAsync(async (req, res) => {
  const guestId = req.user.id;
  const result = await GuestUpgradeService.updateGuestProfile(guestId, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile updated',
    data: result,
  });
});

export const GuestUpgradeController = {
  requestUpgrade,
  verifyUpgrade,
  updateGuestProfile,
};
