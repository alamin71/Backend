import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import config from '../config';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: config.firebase.project_id as string,
      clientEmail: config.firebase.client_email as string,
      privateKey: (config.firebase.private_key as string)?.replace(/\\n/g, '\n'),
    }),
  });
}

export interface INotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Send to single device
export const sendPushNotification = async (
  fcmToken: string,
  payload: INotificationPayload
): Promise<boolean> => {
  try {
    await getMessaging().send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });
    return true;
  } catch {
    return false;
  }
};

// Send to multiple devices
export const sendPushToMultiple = async (
  fcmTokens: string[],
  payload: INotificationPayload
): Promise<void> => {
  if (!fcmTokens.length) return;

  const messages = fcmTokens.map((token) => ({
    token,
    notification: { title: payload.title, body: payload.body },
    data: payload.data || {},
    android: { priority: 'high' as const, notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  }));

  await getMessaging().sendEach(messages);
};
