import express from 'express';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import { SocialAuthController } from './social-auth.controller';
import { GuestUpgradeController } from './guest-upgrade.controller';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { z } from 'zod';

const router = express.Router();

const upgradeRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    userName: z.string().min(1),
  }),
});

const upgradeVerifySchema = z.object({
  body: z.object({
    otp: z.preprocess(Number, z.number().int().min(100000).max(999999)),
  }),
});

router.post(
  '/send-otp',
  validateRequest(AuthValidation.createSendOtpZodSchema),
  AuthController.sendOtp
);

router.post(
  '/verify-otp-login',
  validateRequest(AuthValidation.createVerifyOtpLoginZodSchema),
  AuthController.verifyOtpLogin
);

router.post(
  '/resend-otp',
  validateRequest(AuthValidation.createResendOtpZodSchema),
  AuthController.resendOtp
);

router.post('/refresh-token', AuthController.refreshToken);

router.post(
  '/guest',
  validateRequest(AuthValidation.createGuestLoginZodSchema),
  AuthController.guestLogin
);

// Social auth
router.post('/google', SocialAuthController.googleSignIn);
router.post('/apple', SocialAuthController.appleSignIn);

// Guest upgrade to full account
router.patch(
  '/guest/profile',
  auth(USER_ROLES.GUEST),
  GuestUpgradeController.updateGuestProfile
);
router.post(
  '/guest/upgrade-request',
  auth(USER_ROLES.GUEST),
  validateRequest(upgradeRequestSchema),
  GuestUpgradeController.requestUpgrade
);
router.post(
  '/guest/upgrade-verify',
  validateRequest(upgradeVerifySchema),
  GuestUpgradeController.verifyUpgrade
);

export const AuthRouter = router;
