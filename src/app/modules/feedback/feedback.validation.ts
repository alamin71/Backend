import { z } from 'zod';

const submitFeedbackZodSchema = z.object({
  body: z
    .object({
      rating: z.preprocess(
        (val) => Number(val),
        z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' })
      ),
      text: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.rating <= 3 && (!data.text || data.text.trim().length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['text'],
          message: 'Feedback text is required for ratings of 3 stars or below',
        });
      }
    }),
});

export const FeedbackValidation = { submitFeedbackZodSchema };
