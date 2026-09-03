import { model, Schema } from 'mongoose';
import { IGuest, GuestModel } from './guest.interface';

const guestSchema = new Schema<IGuest, GuestModel>(
  {
    deviceId: { type: String, required: true, unique: true },
    type: { type: String, default: 'guest' },
    name: { type: String, default: '' },
    userName: { type: String, default: '' },
    pendingEmail: { type: String, default: '' },
    pendingOtp: { type: Number, default: null },
    otpExpireAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Guest = model<IGuest, GuestModel>('Guest', guestSchema);
