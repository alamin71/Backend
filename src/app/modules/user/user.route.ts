import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middleware/auth';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
import { PolicyPageController } from '../admin/policy-page.controller';
import { PolicyPageValidation } from '../admin/policy-page.validation';
import { FaqController } from '../admin/faq.controller';
import { IssueController } from '../issue/issue.controller';
import { IssueValidation } from '../issue/issue.validation';
import { issueUploadHandler } from '../../middleware/issueUploadHandler';
import { StatsController } from '../stats/stats.controller';
import { FeedbackController } from '../feedback/feedback.controller';
import { FeedbackValidation } from '../feedback/feedback.validation';
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
router.post(
  '/delete/verify-otp',
  auth(USER_ROLES.USER),
  validateRequest(UserValidation.verifyDeleteOtpZodSchema),
  UserController.verifyDeleteOtp
);
router.delete(
  '/delete',
  validateRequest(UserValidation.deleteAccountZodSchema),
  UserController.deleteProfile
);

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

// Policy pages — public
router.get(
  '/policy/:type',
  validateRequest(PolicyPageValidation.getPolicyPageZodSchema),
  PolicyPageController.getPolicyPage
);

// FAQ — public
router.get('/faq', FaqController.getAllFaqs);
router.get('/faq/:id', FaqController.getFaqById);

// Stats
router.get('/stats', auth(USER_ROLES.USER, USER_ROLES.GUEST), StatsController.getStats);

// Feedback — submit (user only) & get public (user + guest)
router.post(
  '/feedback',
  auth(USER_ROLES.USER),
  validateRequest(FeedbackValidation.submitFeedbackZodSchema),
  FeedbackController.submitFeedback
);
router.get('/feedbacks', auth(USER_ROLES.USER, USER_ROLES.GUEST), FeedbackController.getPublicFeedbacks);

// Get issues (user + guest, read-only)
router.get('/issues', auth(USER_ROLES.USER, USER_ROLES.GUEST), IssueController.getAllIssues);

// Report an issue (user + guest)
router.post(
  '/report-issue',
  auth(USER_ROLES.USER, USER_ROLES.GUEST),
  issueUploadHandler.any(),
  validateRequest(IssueValidation.reportIssueZodSchema),
  IssueController.reportIssue
);

export const UserRouter = router;
