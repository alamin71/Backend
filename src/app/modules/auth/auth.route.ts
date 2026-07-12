import express from 'express';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import { SocialAuthController } from './social-auth.controller';
import validateRequest from '../../middleware/validateRequest';

const router = express.Router();

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

export const AuthRouter = router;
