import { Types } from 'mongoose';

export interface IFeedback {
  userId?: Types.ObjectId;
  name: string;
  userName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  isPublic: boolean;
}
