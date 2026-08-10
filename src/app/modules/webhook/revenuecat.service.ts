import { User } from '../user/user.model';
import { NotificationService } from '../notification/notification.service';

const PRO_EVENTS = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE'];
const FREE_EVENTS = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

const NOTIFICATION_MAP: Record<string, { title: string; body: string }> = {
  INITIAL_PURCHASE: {
    title: '🎉 Welcome to Pro!',
    body: 'Your Pro subscription is now active. Enjoy all premium features!',
  },
  RENEWAL: {
    title: '✅ Subscription Renewed',
    body: 'Your Pro subscription has been successfully renewed.',
  },
  UNCANCELLATION: {
    title: '✅ Subscription Reactivated',
    body: 'Your Pro subscription has been reactivated. Welcome back!',
  },
  NON_RENEWING_PURCHASE: {
    title: '🎉 Pro Access Activated',
    body: 'Your one-time Pro purchase is now active.',
  },
  CANCELLATION: {
    title: 'Subscription Cancelled',
    body: 'Your Pro subscription has been cancelled. You can still use Pro until the end of the billing period.',
  },
  EXPIRATION: {
    title: 'Subscription Expired',
    body: 'Your Pro subscription has expired. Upgrade again to continue enjoying premium features.',
  },
  BILLING_ISSUE: {
    title: 'Payment Issue',
    body: 'We could not process your subscription payment. Please update your payment method.',
  },
};

export const handleRevenueCatWebhook = async (event: any) => {
  const { type, app_user_id, expiration_at_ms } = event;

  if (!app_user_id) return;

  if (PRO_EVENTS.includes(type)) {
    await User.findByIdAndUpdate(app_user_id, {
      userType: 'pro',
      subscriptionExpireAt: expiration_at_ms ? new Date(expiration_at_ms) : null,
    });
  } else if (FREE_EVENTS.includes(type)) {
    await User.findByIdAndUpdate(app_user_id, {
      userType: 'free',
      subscriptionExpireAt: null,
    });
  }

  // Send push notification if we have a message for this event type
  const notifPayload = NOTIFICATION_MAP[type];
  if (notifPayload) {
    await NotificationService.sendNotificationToUser(app_user_id, {
      ...notifPayload,
      type: 'subscription',
      data: { event: type },
    });
  }
};
