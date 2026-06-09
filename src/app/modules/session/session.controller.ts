import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { SessionService } from './session.service';

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
  const userId = req.params.userId;
  const sessions = await SessionService.getSessionsByUser(userId);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Sessions retrieved',
    data: sessions,
  });
});

const getByGuest = catchAsync(async (req, res) => {
  const deviceId = req.params.deviceId;
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
