import { string, z } from 'zod';

export const createUserZodSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .nonempty({ message: 'Name is required' }),
    email: z
      .string()
      .nonempty({ message: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .nonempty({ message: 'Password is required' }),
    phone: string().default('').optional(),
    profile: z.string().optional(),
  }),
});

const updateUserZodSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().optional(),
    image: z.string().optional(),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
};
