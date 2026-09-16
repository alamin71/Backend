import { Types } from 'mongoose';
import { User } from '../user/user.model';
import { Session } from '../session/session.model';
import { NotificationService } from './notification.service';

const FREE_TIER_LIMIT = 10;
const FREE_TIER_WARNING = 8; // send warning at 8th grip

// Get today's grip count for a logged-in user
const getUserGripsToday = async (userId: string): Promise<number> => {
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const result = await Session.aggregate([
    {
      $match: {
        user: new Types.ObjectId(userId),
        createdAt: { $gte: todayUTC },
      },
    },
    { $group: { _id: null, total: { $sum: '$totalGripped' } } },
  ]);

  return result[0]?.total ?? 0;
};

// Called after every session save for logged-in users
export const checkAndSendGripNotification = async (userId: string) => {
  const gripsToday = await getUserGripsToday(userId);

  // Warning at 8th grip
  if (gripsToday === FREE_TIER_WARNING) {
    await NotificationService.sendNotificationToUser(userId, {
      title: 'Only 2 Grips Left Today!',
      body: 'You have 2 grips remaining. Upgrade to Pro for unlimited grips.',
      type: 'grip_warning',
      data: { gripsUsed: String(gripsToday), gripsRemaining: '2' },
    });
  }

  // Limit hit at 10th grip
  if (gripsToday >= FREE_TIER_LIMIT) {
    // Save when limit was hit (for 6-hour reminder cron)
    await User.findByIdAndUpdate(userId, { gripsLimitHitAt: new Date() });

    await NotificationService.sendNotificationToUser(userId, {
      title: 'Daily Grip Limit Reached',
      body: 'You have used all 10 grips for today. Grips refresh at 00:00 UTC. Upgrade to Pro for unlimited grips.',
      type: 'grip_limit',
      data: { gripsUsed: String(gripsToday) },
    });
  }
};

// Cron job: remind users who hit the limit — every 6 hours (60s for testing)
export const sendGripLimitReminders = async () => {
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  // Find users who hit the limit today and have FCM token
  const users = await User.find({
    gripsLimitHitAt: { $gte: todayUTC },
    fcmToken: { $exists: true, $ne: '' },
  }).select('_id fcmToken');

  for (const user of users) {
    await NotificationService.sendNotificationToUser(user._id.toString(), {
      title: 'Still Locked Out?',
      body: 'Your grips refresh at 00:00 UTC. Upgrade to Pro for unlimited grips anytime.',
      type: 'grip_limit_reminder',
      data: {},
    });
  }
};
