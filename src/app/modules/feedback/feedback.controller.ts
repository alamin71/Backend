import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { FeedbackService } from './feedback.service';

// User: submit feedback after session
const submitFeedback = catchAsync(async (req, res) => {
  const { rating, text, platform } = req.body;
  const { id: userId, name, userName, email } = req.user;

  const result = await FeedbackService.submitFeedbackToDB({
    userId,
    name: name || 'User',
    userName: userName || '@user',
    email: email || '',
    rating: Number(rating),
    text,
    platform,
  });

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Feedback submitted successfully',
    data: result,
  });
});

// Public: get 4-5 star feedbacks
const getPublicFeedbacks = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await FeedbackService.getPublicFeedbacksFromDB(page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Public feedbacks retrieved successfully',
    data: result.feedbacks,
    meta: result.pagination,
  });
});

// Admin: get private feedbacks (1-3 stars), filter by ?star=1|2|3 &platform=ios|android
const getPrivateFeedbacks = catchAsync(async (req, res) => {
  const star = req.query.star ? Number(req.query.star) : undefined;
  const platform = req.query.platform as string | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await FeedbackService.getPrivateFeedbacksFromDB(star, platform, page, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Feedbacks retrieved successfully',
    data: { feedbacks: result.feedbacks, stats: result.stats },
    meta: result.pagination,
  });
});

// Admin: get single feedback preview
const getFeedbackById = catchAsync(async (req, res) => {
  const result = await FeedbackService.getFeedbackByIdFromDB(req.params.id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Feedback retrieved successfully',
    data: result,
  });
});

export const FeedbackController = {
  submitFeedback,
  getPublicFeedbacks,
  getPrivateFeedbacks,
  getFeedbackById,
};
