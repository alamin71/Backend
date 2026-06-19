import { User } from '../user/user.model';

// Events that activate pro
const PRO_EVENTS = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE'];

// Events that revert to free
const FREE_EVENTS = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'];

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
};
