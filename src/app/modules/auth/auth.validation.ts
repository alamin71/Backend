import { z } from 'zod';

const otpBodySchema = z.object({
  otp: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .int()
      .min(100000, { message: 'OTP must be 6 digits' })
      .max(999999, { message: 'OTP must be 6 digits' })
  ),
});

const createSignupZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
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
    email: z.string().nonempty({ message: 'Email is required' }),
  }),
});

const createResendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }).optional(),
  }),
});

const createResetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z.string().nonempty({ message: 'Password is required' }),
    confirmPassword: z
      .string()
      .nonempty({ message: 'Confirm Password is required' }),
  }),
});

const createChangePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .nonempty({ message: 'Current Password is required' }),
    newPassword: z.string().nonempty({ message: 'New Password is required' }),
    confirmPassword: z
      .string()
      .nonempty({ message: 'Confirm Password is required' }),
  }),
});

const createVerifyOtpZodSchema = z.object({
  body: otpBodySchema,
});

export const AuthValidation = {
  createSignupZodSchema,
  createForgetPasswordZodSchema,
  createResendOtpZodSchema,
  createLoginZodSchema,
  createResetPasswordZodSchema,
  createChangePasswordZodSchema,
  createVerifyOtpZodSchema,
  createGuestLoginZodSchema: z.object({
    body: z.object({
      deviceId: z.string().nonempty({ message: 'Device ID is required' }),
    }),
  }),
};
