import { Types } from 'mongoose';

export interface IFeedback {
  userId?: Types.ObjectId;
  name: string;
  userName: string;
  email?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  platform?: 'ios' | 'android' | '';
  isPublic: boolean;
}
