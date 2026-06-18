import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import AppError from '../../../errors/AppError';
import { getStatsFromDB } from './stats.service';
import { USER_ROLES } from '../../../enums/user';

const getStats = catchAsync(async (req, res) => {
  const filter = (req.query.filter as string) || 'last7days';

  const validFilters = ['last7days', 'last15days', 'last30days'];
  if (!validFilters.includes(filter)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'filter must be last7days, last15days, or last30days');
  }

  let userId: string | null = null;
  let guestDeviceId: string | null = null;

  if (req.user.role === USER_ROLES.GUEST) {
    guestDeviceId = req.user.deviceId as string;
  } else {
    userId = req.user.id as string;
  }

  const result = await getStatsFromDB(userId, guestDeviceId, filter as any);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Stats retrieved successfully',
    data: result,
  });
});

export const StatsController = { getStats };
