import { Types } from 'mongoose';

export interface IFeedback {
  userId?: Types.ObjectId;
  userName: string;
  userHandle: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  isPublic: boolean; // false for 1-3 stars, true for 4-5 stars
}
