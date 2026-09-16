import { Session } from './session.model';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

const GUEST_DAILY_LIMIT = 10;   // total free tier allowance
const GUEST_SESSION_LIMIT = 5;  // lock-out threshold for guests

const getGuestGripStatus = async (deviceId: string) => {
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const result = await Session.aggregate([
    {
      $match: {
        guestDeviceId: deviceId,
        createdAt: { $gte: todayUTC },
      },
    },
    {
      $group: {
        _id: null,
        totalGripsUsed: { $sum: '$totalGripped' },
      },
    },
  ]);

  const guestGripsUsed = result[0]?.totalGripsUsed ?? 0;
  const guestGripsRemaining = Math.max(0, GUEST_DAILY_LIMIT - guestGripsUsed);
  const guestLimitReached = guestGripsUsed >= GUEST_SESSION_LIMIT;

  return { guestGripsUsed, guestGripsRemaining, guestLimitReached };
};

const createSessionSummary = async (payload: any) => {
  const {
    user,
    guestDeviceId,
    totalGripped,
    storageSavedMB,
    timeSavedSec,
    grips,
  } = payload;
  if (!user && !guestDeviceId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Either user or guestDeviceId is required'
    );
  }

  const session = await Session.create({
    user,
    guestDeviceId,
    totalGripped,
    storageSavedMB,
    timeSavedSec,
    grips,
  });

  // Attach guest grip status to response if this is a guest session
  if (guestDeviceId) {
    const guestStatus = await getGuestGripStatus(guestDeviceId);
    return { ...session.toObject(), guestStatus };
  }

  return session;
};

const getSessionsByUser = async (userId: string) => {
  return await Session.find({ user: userId }).sort({ createdAt: -1 });
};

const getSessionsByGuest = async (deviceId: string) => {
  return await Session.find({ guestDeviceId: deviceId }).sort({
    createdAt: -1,
  });
};

export const SessionService = {
  createSessionSummary,
  getSessionsByUser,
  getSessionsByGuest,
  getGuestGripStatus,
};
