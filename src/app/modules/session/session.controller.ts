import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { SessionService } from './session.service';

const resolveSingleParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const createSession = catchAsync(async (req, res) => {
  const payload = req.body;
  // attach user if present
  if (req.user) {
    payload.user = (req.user as any).id;
  }
  const session = await SessionService.createSessionSummary(payload);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Session summary created',
    data: session,
  });
});

const getByUser = catchAsync(async (req, res) => {
  const userId = resolveSingleParam(req.params.userId);
  if (!userId) {
    throw new Error('userId is required');
  }
  const sessions = await SessionService.getSessionsByUser(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Sessions retrieved',
    data: sessions,
  });
});

const getByGuest = catchAsync(async (req, res) => {
  const deviceId = resolveSingleParam(req.params.deviceId);
  if (!deviceId) {
    throw new Error('deviceId is required');
  }
  const sessions = await SessionService.getSessionsByGuest(deviceId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Guest sessions retrieved',
    data: sessions,
  });
});

export const SessionController = {
  createSession,
  getByUser,
  getByGuest,
};
