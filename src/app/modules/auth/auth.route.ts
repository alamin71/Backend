import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
const router = express.Router();

router.post(
  '/signup',
  validateRequest(AuthValidation.createSignupZodSchema),
  AuthController.signupUser
);

router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);
router.post('/refresh-token', AuthController.refreshToken);
router.post(
  '/forgot-password',
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword
);

router.post(
  '/verify-otp',
  validateRequest(AuthValidation.createVerifyOtpZodSchema),
  AuthController.verifyOtp
);

router.post(
  '/reset-password',
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword
);

// ========================================
// URL-based Password Reset (Commented for future use)
// ========================================
// router.post(
//   "/dashboard/forget-password",
//   validateRequest(AuthValidation.createForgetPasswordZodSchema),
//   AuthController.forgetPasswordByUrl
// );

// router.post(
//   "/dashboard/reset-password",
//   auth(USER_ROLES.ADMIN, USER_ROLES.USER),
//   validateRequest(AuthValidation.createResetPasswordZodSchema),
//   AuthController.resetPasswordByUrl
// );

router.post(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword
);
router.post(
  '/resend-otp',
  validateRequest(AuthValidation.createResendOtpZodSchema),
  AuthController.resendOtp
);

export const AuthRouter = router;
