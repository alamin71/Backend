import { model, Schema, Types } from 'mongoose';

export interface INotification {
  userId: Types.ObjectId;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
  isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'general' },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notification = model<INotification>('Notification', notificationSchema);
