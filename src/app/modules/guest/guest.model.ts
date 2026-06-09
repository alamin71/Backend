import { model, Schema } from 'mongoose';
import { IGuest, GuestModel } from './guest.interface';

const guestSchema = new Schema<IGuest, GuestModel>(
  {
    deviceId: { type: String, required: true, unique: true },
    type: { type: String, default: 'guest' },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Guest = model<IGuest, GuestModel>('Guest', guestSchema);
