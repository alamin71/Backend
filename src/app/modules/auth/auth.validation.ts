import { z } from 'zod';

const createSendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

const createVerifyOtpLoginZodSchema = z.object({
  body: z.object({
    otp: z.preprocess(
      (val) => Number(val),
      z
        .number()
        .int()
        .min(100000, { message: 'OTP must be 6 digits' })
        .max(999999, { message: 'OTP must be 6 digits' })
    ),
  }),
});

const createResendOtpZodSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

const createGuestLoginZodSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1, { message: 'Device ID is required' }),
  }),
});

export const AuthValidation = {
  createSendOtpZodSchema,
  createVerifyOtpLoginZodSchema,
  createResendOtpZodSchema,
  createGuestLoginZodSchema,
};
