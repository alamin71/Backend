import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { getDashboardStats } from './dashboard.service';

const getDashboard = catchAsync(async (req, res) => {
  const {
    signup_filter,
    user_stats_filter,
    app_usage_filter,
    clip_filter,
  } = req.query as Record<string, string>;

  const result = await getDashboardStats({
    signupFilter: (signup_filter as any) || 'this_month',
    userStatsFilter: (user_stats_filter as any) || 'this_month',
    appUsageFilter: (app_usage_filter as any) || 'this_week',
    clipFilter: (clip_filter as any) || 'this_month',
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

export const DashboardController = { getDashboard };
