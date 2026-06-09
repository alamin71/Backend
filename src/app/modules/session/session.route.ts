import express from 'express';
import validateRequest from '../../middleware/validateRequest';
import { SessionController } from './session.controller';
import { AuthValidation } from '../auth/auth.validation';
const router = express.Router();

// Create session summary (public — can include deviceId or authenticated user)
router.post('/', SessionController.createSession);

// Get sessions for a user
router.get('/user/:userId', SessionController.getByUser);

// Get sessions for a guest device
router.get('/guest/:deviceId', SessionController.getByGuest);

export const SessionRouter = router;
