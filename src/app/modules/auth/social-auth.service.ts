import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';
import { Secret } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import config from '../../../config';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { User } from '../user/user.model';
import { USER_ROLES, USER_STATUS } from '../../../enums/user';
import AppError from '../../../errors/AppError';

const googleClient = new OAuth2Client(config.social.google_client_id as string);

// ─── Google Sign-In ───────────────────────────────────────────────────────────
const googleSignInToDB = async (idToken: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.social.google_client_id as string,
  }).catch(() => {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid Google token');
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Google token missing email');
  }

  const { email, name, sub: googleId } = payload;
  return upsertSocialUser({ email, name: name || email.split('@')[0], providerId: googleId!, provider: 'google' });
};

// ─── Apple Sign-In ────────────────────────────────────────────────────────────
const appleSignInToDB = async (identityToken: string, fullName?: string) => {
  const applePayload = await appleSignin.verifyIdToken(identityToken, {
    audience: config.apple.client_id as string,
    ignoreExpiration: false,
  }).catch(() => {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid Apple token');
  });

  const { email, sub: appleId } = applePayload;
  if (!email && !appleId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Apple token missing user info');
  }

  const resolvedEmail = email || `${appleId}@privaterelay.appleid.com`;
  return upsertSocialUser({ email: resolvedEmail, name: fullName || resolvedEmail.split('@')[0], providerId: appleId, provider: 'apple' });
};

// ─── Shared upsert logic ──────────────────────────────────────────────────────
const upsertSocialUser = async (data: {
  email: string;
  name: string;
  providerId: string;
  provider: string;
}) => {
  const { email, name, } = data;
  const localPart = email.split('@')[0];

  let user = await User.findOne({ email }).select('+authentication');

  if (!user) {
    // First time → create user
    user = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name,
          userName: '@' + localPart,
          email,
          role: USER_ROLES.USER,
          status: USER_STATUS.ACTIVE,
          verified: true,
          isDeleted: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (!user) throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user');

  if (user.status === USER_STATUS.BLOCKED) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account has been blocked');
  }

  const jwtPayload = {
    id: user._id,
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const accessToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );
  const refreshToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_refresh_secret as string,
    config.jwt.jwt_refresh_expire_in as string
  );

  const userData = await User.findById(user._id).select('name userName email role image status verified');

  return { accessToken, refreshToken, user: userData };
};

export const SocialAuthService = { googleSignInToDB, appleSignInToDB };
