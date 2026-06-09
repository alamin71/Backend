import { Session } from './session.model';
import AppError from '../../../errors/AppError';
import { StatusCodes } from 'http-status-codes';

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
};
