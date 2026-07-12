import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';
import { PolicyPageController } from './policy-page.controller';
import { PolicyPageValidation } from './policy-page.validation';
import { FaqController } from './faq.controller';
import { FaqValidation } from './faq.validation';
import { IssueController } from '../issue/issue.controller';
import { IssueValidation } from '../issue/issue.validation';
import { FeedbackController } from '../feedback/feedback.controller';
import { NotificationController } from '../notification/notification.controller';
import { DashboardController } from '../dashboard/dashboard.controller';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
const router = express.Router();
const adminUpload = s3FileUploadHandler;

// Admin login - returns admin data
router.post(
  '/login',
  validateRequest(AdminValidation.createLoginZodSchema),
  AdminController.adminLogin
);

// Admin password reset (OTP-based) - returns admin data
router.post(
  '/forget-password',
  validateRequest(AdminValidation.createForgetPasswordZodSchema),
  AdminController.adminForgetPassword
);
router.post(
  '/verify-reset-otp',
  validateRequest(AdminValidation.createVerifyResetOtpZodSchema),
  AdminController.adminVerifyResetOtp
);
router.post(
  '/reset-password',
  validateRequest(AdminValidation.createResetPasswordZodSchema),
  AdminController.adminResetPassword
);

// Admin password change (logged in only) - returns admin data
router.patch(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.createChangePasswordZodSchema),
  AdminController.changePassword
);

// Admin resend OTP - returns admin data
router.post(
  '/resend-otp',
  validateRequest(AdminValidation.createResendOtpZodSchema),
  AdminController.adminResendOtp
);

//=============================================
// Dashboard
//=============================================
router.get(
  '/dashboard',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  DashboardController.getDashboard
);

// ============================================
// ADMIN MANAGEMENT ENDPOINTS
// ============================================

router.get(
  '/get-admin',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.getAdmin
);

router.get(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AdminController.getAdminProfile
);

router.patch(
  '/profile/update',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  adminUpload.fields([{ name: 'image', maxCount: 1 }]),
  AdminController.updateAdminProfile
);

router.delete(
  '/profile/photo',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AdminController.removeProfilePhoto
);
// Email Change Endpoints
router.post(
  '/change-email/request',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.requestEmailChangeZodSchema),
  AdminController.requestEmailChange
);

router.post(
  '/change-email/verify-otp',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.verifyEmailChangeOtpZodSchema),
  AdminController.verifyEmailChangeOtp
);
//=============================================
// Policy Pages
//=============================================
router.get(
  '/policy',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  PolicyPageController.getPolicyPages
);

router.get(
  '/policy/:type',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PolicyPageValidation.getPolicyPageZodSchema),
  PolicyPageController.getPolicyPage
);

router.post(
  '/policy/:type',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PolicyPageValidation.createPolicyPageZodSchema),
  PolicyPageController.createPolicyPage
);

router.patch(
  '/policy/:type',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(PolicyPageValidation.updatePolicyPageZodSchema),
  PolicyPageController.updatePolicyPage
);

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.deleteAdmin
);

//=============================================
// FAQ
//=============================================
router.post(
  '/faq',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(FaqValidation.createFaqZodSchema),
  FaqController.createFaq
);

router.get(
  '/faq',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  FaqController.getAllFaqs
);

router.get(
  '/faq/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  FaqController.getFaqById
);

router.patch(
  '/faq/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(FaqValidation.updateFaqZodSchema),
  FaqController.updateFaq
);

router.delete(
  '/faq/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  FaqController.deleteFaq
);

//=============================================
// Notifications (admin send)
//=============================================
router.post(
  '/notifications/send',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.sendToUser
);
router.post(
  '/notifications/broadcast',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  NotificationController.sendToAll
);

//=============================================
// Feedbacks (private: 1-3 stars, admin only)
//=============================================
router.get(
  '/feedbacks',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  FeedbackController.getPrivateFeedbacks
);
router.get(
  '/feedbacks/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  FeedbackController.getFeedbackById
);

//=============================================
// Issues
//=============================================
router.get(
  '/issues',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  IssueController.getAllIssues
);

router.get(
  '/issues/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  IssueController.getIssueById
);

router.patch(
  '/issues/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(IssueValidation.updateIssueStatusZodSchema),
  IssueController.updateIssueStatus
);

router.delete(
  '/issues/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  IssueController.deleteIssue
);

// Admin management delete — MUST come after all specific routes
router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.deleteAdmin
);

export const AdminRoutes = router;
