import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationService } from './notification.service';

// User: register FCM token
const registerFcmToken = catchAsync(async (req, res) => {
  const { fcmToken } = req.body;
  const result = await NotificationService.registerFcmTokenToDB(req.user.id, fcmToken);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: result.message, data: null });
});

// User: get my notifications
const getMyNotifications = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const result = await NotificationService.getUserNotificationsFromDB(req.user.id, page, limit);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: { notifications: result.notifications, unreadCount: result.unreadCount },
    meta: result.pagination,
  });
});

// User: mark single as read
const markAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAsReadInDB(req.params.id as string, req.user.id);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: 'Marked as read', data: result });
});

// User: mark all as read
const markAllAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAllAsReadInDB(req.user.id);
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: result.message, data: null });
});

// Admin: send to specific user
const sendToUser = catchAsync(async (req, res) => {
  const { userId, title, body, type, data } = req.body;
  const result = await NotificationService.sendNotificationToUser(userId, { title, body, type, data });
  sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: result.message, data: null });
});

// Admin: broadcast to all users
const sendToAll = catchAsync(async (req, res) => {
  const { title, body, type, data } = req.body;
  const result = await NotificationService.sendNotificationToAll({ title, body, type, data });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Notification sent to ${result.sent} users`,
    data: null,
  });
});

export const NotificationController = {
  registerFcmToken,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendToUser,
  sendToAll,
};
