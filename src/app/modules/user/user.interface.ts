import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
export type IUser = {
  name: string;
  userName?: string;
  role: USER_ROLES;
  email: string;
  password?: string;
  image?: string;
  isDeleted: boolean;
  fcmToken?: string;
  stripeCustomerId: string;
  status: 'active' | 'blocked';
  verified: boolean;
  userType: 'free' | 'pro';
  os?: 'ios' | 'android' | '';
  lastSeen?: Date | null;
  subscriptionExpireAt: Date | null;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number | null;
    expireAt: Date | null;
    pendingEmail?: string;
    emailChangeOtp?: number | null;
    emailChangeExpireAt?: Date | null;
  };
};

export type UserModel = {
  isExistUserById(id: string): Promise<IUser | null>;
  isExistUserByEmail(email: string): Promise<IUser | null>;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
