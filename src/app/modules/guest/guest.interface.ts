import { Model } from 'mongoose';

export type IGuest = {
  deviceId: string;
  type: string;
  meta?: Record<string, any>;
};

export type GuestModel = {} & Model<IGuest>;
