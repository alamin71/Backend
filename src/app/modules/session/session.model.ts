import { model, Schema } from 'mongoose';
import { ISession, SessionModel } from './session.interface';

const gripSchema = new Schema(
  {
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    duration: { type: Number, required: true },
    sizeMB: { type: Number, required: true },
    filePath: { type: String },
  },
  { _id: false }
);

const sessionSchema = new Schema<ISession, SessionModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    guestDeviceId: { type: String, required: false, index: true },
    totalGripped: { type: Number, default: 0 },
    storageSavedMB: { type: Number, default: 0 },
    timeSavedSec: { type: Number, default: 0 },
    grips: { type: [gripSchema], default: [] },
  },
  { timestamps: true }
);

export const Session = model<ISession, SessionModel>('Session', sessionSchema);
