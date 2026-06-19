import express from 'express';
import { revenueCatWebhook } from './revenuecat.controller';

const router = express.Router();

router.post('/revenuecat', revenueCatWebhook);

export const WebhookRouter = router;
