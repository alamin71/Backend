import cron from 'node-cron';
import { sendGripLimitReminders } from '../app/modules/notification/grip-notification.service';

export const startGripReminderCron = () => {
  // Runs every minute to detect when exactly 6 hours have passed since limit hit
  cron.schedule('* * * * *', async () => {
    try {
      await sendGripLimitReminders();
    } catch {
      // Cron failure should not crash the server
    }
  });

  console.log('Grip limit reminder cron started — checks every minute, fires once 6h after limit hit');
};
