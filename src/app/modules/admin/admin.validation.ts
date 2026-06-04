import { z } from 'zod';
import { USER_ROLES } from '../../../enums/user';

const createAdminZodSchema = z.object({
  body: z.object({
    name: z.string().nonempty({ message: 'Name is required' }),
    userName: z.string().optional(),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().nonempty({ message: 'Password is required' }),
    role: z.nativeEnum(USER_ROLES, { message: 'Role is required' }),
    authProvider: z.string().optional(),
    isEmailVerified: z.boolean().optional(),
    verified: z.boolean().optional(),
  }),
});

const createLoginZodSchema = z.object({
  body: z.object({
    email: z.string().nonempty({ message: 'Email is required' }),
    password: z.string().nonempty({ message: 'Password is required' }),
  }),
});

const createForgetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

const createResendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

const createVerifyResetOtpZodSchema = z.object({
  body: z.object({
    otp: z.preprocess(
      (val) => Number(val),
      z.number().int().nonnegative({ message: 'OTP is required' })
    ),
  }),
});

const createChangePasswordZodSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .nonempty({ message: 'Current password is required' }),
      newPassword: z.string().nonempty({ message: 'New password is required' }),
      confirmPassword: z
        .string()
        .nonempty({ message: 'Confirm password is required' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
});

const createResetPasswordZodSchema = z.object({
  body: z
    .object({
      newPassword: z.string().nonempty({ message: 'New password is required' }),
      confirmPassword: z
        .string()
        .nonempty({ message: 'Confirm password is required' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
});
// Email Change Validation Schemas
const requestEmailChangeZodSchema = z.object({
  body: z.object({
    newEmail: z.string().email({ message: 'Invalid email address' }),
  }),
});

const verifyEmailChangeOtpZodSchema = z.object({
  body: z.object({
    otp: z.preprocess(
      (val) => Number(val),
      z.number().int().nonnegative({ message: 'OTP is required' })
    ),
  }),
});

const createVerifyOtpZodSchema = createVerifyResetOtpZodSchema;

export const AdminValidation = {
  createAdminZodSchema,
  createLoginZodSchema,
  createForgetPasswordZodSchema,
  createResendOtpZodSchema,
  createVerifyResetOtpZodSchema,
  createChangePasswordZodSchema,
  createVerifyOtpZodSchema,
  createResetPasswordZodSchema,
  requestEmailChangeZodSchema,
  verifyEmailChangeOtpZodSchema,
};
