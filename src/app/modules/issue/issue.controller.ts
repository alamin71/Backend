import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { uploadMultipleToS3 } from '../../../helpers/s3Helper';
import { IssueService } from './issue.service';

// User: Submit an issue report
const reportIssue = catchAsync(async (req, res) => {
  const { subject, description, email } = req.body;

  // Upload attachments to S3
  const files = req.files as Express.Multer.File[] | undefined;
  const attachments: string[] = [];
  if (files && files.length > 0) {
    const urls = await uploadMultipleToS3(files, 'issues/attachments');
    attachments.push(...urls);
  }

  const userId = req.user?.id
    ? new Types.ObjectId(String(req.user.id))
    : undefined;

  const result = await IssueService.reportIssueToDB({
    subject,
    description,
    email,
    attachments,
    userId,
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Issue reported successfully. We will get back to you soon.',
    data: result,
  });
});

// Admin: Get all issues (?tab=pending → pending+in-progress, ?tab=solved → solved, no tab → all)
const getAllIssues = catchAsync(async (req, res) => {
  const tab = req.query.tab as string | undefined;
  const result = await IssueService.getAllIssuesFromDB(tab);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Issues retrieved successfully',
    data: result,
  });
});

// Admin: Get single issue by ID
const getIssueById = catchAsync(async (req, res) => {
  const result = await IssueService.getIssueByIdFromDB(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Issue retrieved successfully',
    data: result,
  });
});

// Admin: Update issue status
const updateIssueStatus = catchAsync(async (req, res) => {
  const result = await IssueService.updateIssueStatusInDB(
    req.params.id as string,
    req.body.status
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Issue status updated successfully',
    data: result,
  });
});

// Admin: Delete issue
const deleteIssue = catchAsync(async (req, res) => {
  await IssueService.deleteIssueFromDB(req.params.id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Issue deleted successfully',
    data: null,
  });
});

export const IssueController = {
  reportIssue,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
};
