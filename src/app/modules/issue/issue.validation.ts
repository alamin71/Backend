import { z } from 'zod';

const reportIssueZodSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(1, { message: 'Subject is required' }),
    description: z.string().trim().min(1, { message: 'Description is required' }),
  }),
});

const updateIssueStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'in-progress', 'solved'], {
      message: 'Status must be pending, in-progress, or solved',
    }),
  }),
});

export const IssueValidation = {
  reportIssueZodSchema,
  updateIssueStatusZodSchema,
};
