import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
import AppError from '../../../errors/AppError';
import { IUser, UserModel } from './user.interface';

const userSchema = new Schema<IUser, UserModel>(
  {
    name: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
      select: false,
    },
    image: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      type: String,
      default: '',
    },
    os: {
      type: String,
      enum: ['ios', 'android', ''],
      default: '',
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: '',
    },
    userType: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    subscriptionExpireAt: {
      type: Date,
      default: null,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
        pendingEmail: {
          type: String,
          default: '',
        },
        emailChangeOtp: {
          type: Number,
          default: null,
        },
        emailChangeExpireAt: {
          type: Date,
          default: null,
        },
      },
      select: false,
    },
  },
  { timestamps: true }
);

// Exist User Check
userSchema.statics.isExistUserById = async (id: string) => {
  return await User.findById(id);
};

// db.users.updateOne({email:"tihow91361@linxues.com"},{email:"rakibhassan305@gmail.com"})

userSchema.statics.isExistUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};
// Password Matching
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

// Pre-Save Hook for Hashing Password & Checking Email Uniqueness
userSchema.pre('save', async function (next) {
  const isExist = await User.findOne({ email: this.get('email') });
  if (isExist) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Email already exists!');
  }

  if (this.password) {
    const pwd = this.password;
    this.password = await bcrypt.hash(pwd, Number(config.bcrypt_salt_rounds)) as string;
  }
  next();
});

// Query Middleware
userSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

userSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});
export const User = model<IUser, UserModel>('User', userSchema);
