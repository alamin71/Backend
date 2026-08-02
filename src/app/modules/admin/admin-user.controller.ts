import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminUserService } from './admin-user.service';

const getUsers = catchAsync(async (req, res) => {
  const { filter, search, userType } = req.query as Record<string, string>;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const result = await AdminUserService.getAdminUsersFromDB({
    filter: filter as any,
    search,
    userType,
    page,
    limit,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result.users,
    meta: result.pagination,
  });
});

export const AdminUserController = { getUsers };
