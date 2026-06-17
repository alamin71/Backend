import { z } from 'zod';

const createFaqZodSchema = z.object({
  body: z.object({
    question: z.string().trim().min(1, { message: 'Question is required' }),
    answer: z.string().trim().min(1, { message: 'Answer is required' }),
  }),
});

const updateFaqZodSchema = z.object({
  body: z
    .object({
      question: z.string().trim().min(1).optional(),
      answer: z.string().trim().min(1).optional(),
    })
    .refine((data) => data.question !== undefined || data.answer !== undefined, {
      message: 'At least one field (question or answer) is required',
    }),
});

export const FaqValidation = {
  createFaqZodSchema,
  updateFaqZodSchema,
};
