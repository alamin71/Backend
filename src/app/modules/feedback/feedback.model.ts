import { model, Schema } from 'mongoose';
import { IFeedback } from './feedback.interface';

const feedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: { type: String, required: true, trim: true },
    userName: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    rating: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
    text: { type: String, default: '', trim: true },
    platform: { type: String, enum: ['ios', 'android', ''], default: '' },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Feedback = model<IFeedback>('Feedback', feedbackSchema);
