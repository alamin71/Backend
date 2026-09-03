import { StatusCodes } from 'http-status-codes';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { User } from '../user/user.model';
import { Guest } from '../guest/guest.model';
import { Session } from '../session/session.model';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';

// Step 1: Guest requests upgrade — sends OTP to email
const requestUpgrade = async (
  guestId: string,
  payload: { email: string; name: string; userName: string }
) => {
  const { email, name, userName } = payload;

  const guest = await Guest.findById(guestId);
  if (!guest) throw new AppError(StatusCodes.NOT_FOUND, 'Guest not found');

  // Email already registered as a full user?
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(StatusCodes.CONFLICT, 'This email is already registered. Please login instead.');
  }

  const otp = generateOTP(6);
  const otpExpireAt = new Date(Date.now() + 5 * 60000);

  // Save pending data to guest
  await Guest.findByIdAndUpdate(guestId, {
    name,
    userName,
    pendingEmail: email,
    pendingOtp: otp,
    otpExpireAt,
  });

  // Send OTP email
  const template = emailTemplate.createAccount({ name, otp, email } as any);
  emailHelper.sendEmail(template);

  // Return short-lived OTP token (same pattern as normal auth)
  const otpToken = jwtHelper.createToken(
    { guestId, purpose: 'guest-upgrade' },
    config.jwt.jwt_secret as Secret,
    '10m'
  );

  return { otpToken };
};

// Step 2: Verify OTP → convert guest to full user + migrate sessions
const verifyUpgrade = async (guestId: string, otp: number) => {
  const guest = await Guest.findById(guestId);
  if (!guest) throw new AppError(StatusCodes.NOT_FOUND, 'Guest not found');

  if (!guest.pendingEmail || !guest.pendingOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'No pending upgrade found. Please request OTP first.');
  }

  if (String(guest.pendingOtp) !== String(otp)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid OTP');
  }

  if (!guest.otpExpireAt || new Date() > guest.otpExpireAt) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'OTP expired. Please request a new one.');
  }

  // Create full user account
  const newUser = await User.create({
    name: guest.name || 'User',
    userName: guest.userName || '@NOSHOTSPOV',
    email: guest.pendingEmail,
    role: USER_ROLES.USER,
    status: USER_STATUS.ACTIVE,
    verified: true,
    isDeleted: false,
  });

  // Migrate all sessions from guestDeviceId → new userId
  await Session.updateMany(
    { guestDeviceId: guest.deviceId },
    { $set: { user: newUser._id }, $unset: { guestDeviceId: '' } }
  );

  // Delete guest record
  await Guest.findByIdAndDelete(guestId);

  // Generate tokens for the new user
  const jwtData = {
    id: newUser._id,
    role: newUser.role,
    email: newUser.email,
    name: newUser.name,
  };

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

  const userData = await User.findById(newUser._id).select(
    'name userName email role image status verified userType'
  );

  return { accessToken, refreshToken, user: userData };
};

// Update guest name/username (preview before upgrade)
const updateGuestProfile = async (
  guestId: string,
  payload: { name?: string; userName?: string }
) => {
  const guest = await Guest.findByIdAndUpdate(guestId, payload, { new: true });
  if (!guest) throw new AppError(StatusCodes.NOT_FOUND, 'Guest not found');
  return { name: guest.name, userName: guest.userName };
};

export const GuestUpgradeService = {
  requestUpgrade,
  verifyUpgrade,
  updateGuestProfile,
};
