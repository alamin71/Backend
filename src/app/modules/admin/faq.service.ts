import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IFaq, Faq } from './faq.model';

const createFaqToDB = async (payload: IFaq) => {
  return Faq.create(payload);
};

const getAllFaqsFromDB = async () => {
  return Faq.find().sort({ createdAt: -1 });
};

const getFaqByIdFromDB = async (id: string) => {
  const faq = await Faq.findById(id);
  if (!faq) {
    throw new AppError(StatusCodes.NOT_FOUND, 'FAQ not found');
  }
  return faq;
};

const updateFaqInDB = async (id: string, payload: Partial<IFaq>) => {
  const faq = await Faq.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!faq) {
    throw new AppError(StatusCodes.NOT_FOUND, 'FAQ not found');
  }
  return faq;
};

const deleteFaqFromDB = async (id: string) => {
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) {
    throw new AppError(StatusCodes.NOT_FOUND, 'FAQ not found');
  }
  return faq;
};

export const FaqService = {
  createFaqToDB,
  getAllFaqsFromDB,
  getFaqByIdFromDB,
  updateFaqInDB,
  deleteFaqFromDB,
};
