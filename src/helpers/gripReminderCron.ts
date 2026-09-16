import cron from 'node-cron';
import { sendGripLimitReminders } from '../app/modules/notification/grip-notification.service';
import config from '../config';

export const startGripReminderCron = () => {
  // In test mode (CRON_TEST_MODE=true): runs every 60 seconds
  // In production: runs every 6 hours
  const schedule = config.cron_test_mode === 'true' ? '* * * * *' : '0 */6 * * *';

  cron.schedule(schedule, async () => {
    try {
      await sendGripLimitReminders();
    } catch {
      // Cron failure should not crash the server
    }
  });

  const label = config.cron_test_mode === 'true' ? 'every 60s (test)' : 'every 6 hours';
  console.log(`Grip limit reminder cron started — ${label}`);
};
