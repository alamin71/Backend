import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import { Feedback } from './feedback.model';

const submitFeedbackToDB = async (payload: {
  userId?: string;
  name: string;
  userName: string;
  email?: string;
  rating: number;
  text?: string;
  platform?: string;
}) => {
  const { rating } = payload;
  const isPublic = rating >= 4;

  return Feedback.create({
    userId: payload.userId ? new Types.ObjectId(payload.userId) : undefined,
    name: payload.name,
    userName: payload.userName,
    email: payload.email || '',
    rating,
    text: payload.text || '',
    platform: payload.platform || '',
    isPublic,
  });
};

// Admin: get private feedbacks (1-3 stars), optional filter by star + platform
const getPrivateFeedbacksFromDB = async (
  star?: number,
  platform?: string,
  page = 1,
  limit = 10
) => {
  const filter: Record<string, any> = { isPublic: false };
  if (star && [1, 2, 3].includes(star)) filter.rating = star;
  if (platform && ['ios', 'android'].includes(platform)) filter.platform = platform;

  const baseFilter = { isPublic: false };
  const skip = (page - 1) * limit;

  const [feedbacks, total, totalAll, androidCount, iosCount] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(filter),
    Feedback.countDocuments(baseFilter),
    Feedback.countDocuments({ ...baseFilter, platform: 'android' }),
    Feedback.countDocuments({ ...baseFilter, platform: 'ios' }),
  ]);

  return {
    feedbacks,
    stats: { total: totalAll, android: androidCount, ios: iosCount },
    pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
  };
};

// Admin: get single feedback
const getFeedbackByIdFromDB = async (id: string) => {
  const feedback = await Feedback.findById(id);
  if (!feedback) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Feedback not found');
  }
  return feedback;
};

// Public: get 4-5 star feedbacks
const getPublicFeedbacksFromDB = async (page = 1, limit = 10) => {
  const filter = { isPublic: true };
  const skip = (page - 1) * limit;
  const [feedbacks, total] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(filter),
  ]);

  return {
    feedbacks,
    pagination: { total, page, limit, totalPage: Math.ceil(total / limit) },
  };
};

export const FeedbackService = {
  submitFeedbackToDB,
  getPrivateFeedbacksFromDB,
  getFeedbackByIdFromDB,
  getPublicFeedbacksFromDB,
};
