import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import { User } from '../user/user.model';
import { sendPushNotification, sendPushToMultiple, INotificationPayload } from '../../../helpers/firebaseHelper';
import { Notification } from './notification.model';

// Save FCM token for user
const registerFcmTokenToDB = async (userId: string, fcmToken: string) => {
  await User.findByIdAndUpdate(userId, { fcmToken });
  return { message: 'FCM token registered successfully' };
};

// Send notification to a single user and save to history
const sendNotificationToUser = async (
  userId: string,
  payload: INotificationPayload & { type?: string }
) => {
  const user = await User.findById(userId).select('fcmToken');
  if (!user) throw new AppError(StatusCodes.NOT_FOUND, 'User not found');

  // Save to notification history
  await Notification.create({
    userId: new Types.ObjectId(userId),
    title: payload.title,
    body: payload.body,
    type: payload.type || 'general',
    data: payload.data || {},
  });

  // Send FCM push if token exists
  if (user.fcmToken) {
    await sendPushNotification(user.fcmToken, payload);
  }

  return { message: 'Notification sent' };
};

// Send to all users (broadcast)
const sendNotificationToAll = async (payload: INotificationPayload & { type?: string }) => {
  const users = await User.find({ fcmToken: { $exists: true, $ne: '' } }).select('_id fcmToken');

  const tokens = users.map((u) => u.fcmToken as string).filter(Boolean);

  // Save to all users' notification history
  const notifications = users.map((u) => ({
    userId: u._id,
    title: payload.title,
    body: payload.body,
    type: payload.type || 'general',
    data: payload.data || {},
  }));
  if (notifications.length) await Notification.insertMany(notifications);

  if (tokens.length) await sendPushToMultiple(tokens, payload);

  return { sent: tokens.length };
};

// Get notifications for a user (with pagination)
const getUserNotificationsFromDB = async (userId: string, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: new Types.ObjectId(userId) }),
    Notification.countDocuments({ userId: new Types.ObjectId(userId), isRead: false }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
  };
};

// Mark single notification as read
const markAsReadInDB = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId: new Types.ObjectId(userId) },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new AppError(StatusCodes.NOT_FOUND, 'Notification not found');
  return notification;
};

// Mark all as read
const markAllAsReadInDB = async (userId: string) => {
  await Notification.updateMany(
    { userId: new Types.ObjectId(userId), isRead: false },
    { isRead: true }
  );
  return { message: 'All notifications marked as read' };
};

export const NotificationService = {
  registerFcmTokenToDB,
  sendNotificationToUser,
  sendNotificationToAll,
  getUserNotificationsFromDB,
  markAsReadInDB,
  markAllAsReadInDB,
};
