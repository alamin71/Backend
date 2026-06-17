import { model, Schema } from 'mongoose';

export interface IFaq {
  question: string;
  answer: string;
}

const faqSchema = new Schema<IFaq>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Faq = model<IFaq>('Faq', faqSchema);
