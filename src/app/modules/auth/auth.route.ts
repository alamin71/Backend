import express from 'express';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
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

export const AuthRouter = router;
