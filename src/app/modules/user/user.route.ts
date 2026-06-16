import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middleware/auth';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
const router = express.Router();

router
  .route('/profile')
  .get(auth(USER_ROLES.ADMIN, USER_ROLES.USER), UserController.getUserProfile)
  .patch(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
    s3FileUploadHandler.fields([{ name: 'image', maxCount: 1 }]),
    validateRequest(UserValidation.updateUserZodSchema),
    UserController.updateProfile
  );

router
  .route('/')
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser
  );

router.post('/delete/send-otp', auth(USER_ROLES.USER), UserController.sendDeleteOtp);
router.delete('/delete', auth(USER_ROLES.USER), UserController.deleteProfile);

router.post(
  '/change-email/send-otp',
  auth(USER_ROLES.USER),
  validateRequest(UserValidation.requestEmailChangeZodSchema),
  UserController.requestEmailChange
);

router.post(
  '/change-email/verify-otp',
  auth(USER_ROLES.USER),
  validateRequest(UserValidation.verifyEmailChangeOtpZodSchema),
  UserController.verifyEmailChangeOtp
);

export const UserRouter = router;
