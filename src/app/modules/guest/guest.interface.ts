import { Model } from 'mongoose';

export type IGuest = {
  deviceId: string;
  type: string;
  name?: string;
  userName?: string;
  pendingEmail?: string;
  pendingOtp?: number | null;
  otpExpireAt?: Date | null;
  meta?: Record<string, any>;
};

export type GuestModel = {} & Model<IGuest>;
