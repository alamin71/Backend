import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { handleRevenueCatWebhook } from './revenuecat.service';

export const revenueCatWebhook = async (req: Request, res: Response) => {
  try {
    // Verify RevenueCat authorization header
    const authHeader = req.headers.authorization;
    const secret = config.revenuecat.webhook_secret;

    if (secret && authHeader !== secret) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }

    const event = req.body?.event;
    if (!event) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid payload' });
    }

    await handleRevenueCatWebhook(event);

    return res.status(StatusCodes.OK).json({ received: true });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Webhook error' });
  }
};
