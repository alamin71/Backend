import { Model } from 'mongoose';

export type IGrip = {
  start: number; // seconds
  end: number; // seconds
  duration: number; // seconds
  sizeMB: number;
  filePath?: string;
};

export type ISession = {
  user?: string;
  guestDeviceId?: string;
  totalGripped: number;
  storageSavedMB: number;
  timeSavedSec: number;
  grips: IGrip[];
};

export type SessionModel = {} & Model<ISession>;
