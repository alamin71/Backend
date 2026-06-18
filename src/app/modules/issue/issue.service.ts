import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import { emailHelper } from '../../../helpers/emailHelper';
import config from '../../../config';
import { IIssue, IssueStatus } from './issue.interface';
import { Issue } from './issue.model';

const reportIssueToDB = async (
  payload: Pick<IIssue, 'subject' | 'description' | 'email' | 'attachments'> & {
    userId?: Types.ObjectId;
  }
) => {
  const issue = await Issue.create(payload);

  // Notify super admin via email
  const adminEmail = config.super_admin.email as string;
  if (adminEmail) {
    const mailData = {
      to: adminEmail,
      subject: `New Issue Report: ${issue.subject}`,
      html: `
        <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
          <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="color: #d9534f;">New Issue Reported</h2>
            <p><strong>Issue ID:</strong> #${issue.issueId}</p>
            <p><strong>From:</strong> ${issue.email}</p>
            <p><strong>Subject:</strong> ${issue.subject}</p>
            <p><strong>Description:</strong></p>
            <div style="background-color: #f4f4f4; padding: 12px; border-radius: 8px; margin: 10px 0;">
              ${issue.description}
            </div>
            ${
              issue.attachments.length > 0
                ? `<p><strong>Attachments (${issue.attachments.length}):</strong></p>
                   <ul>${issue.attachments.map((url) => `<li><a href="${url}">${url}</a></li>`).join('')}</ul>`
                : ''
            }
            <p style="color: #888; font-size: 13px; margin-top: 20px;">Reported at: ${new Date().toLocaleString()}</p>
          </div>
        </body>`,
    };
    emailHelper.sendEmail(mailData);
  }

  return issue;
};

const getAllIssuesFromDB = async (tab?: string, page = 1, limit = 10) => {
  let filter = {};

  if (tab === 'pending') {
    filter = { status: { $in: ['pending', 'in-progress'] } };
  } else if (tab === 'solved') {
    filter = { status: 'solved' };
  }

  const skip = (page - 1) * limit;
  const [issues, total] = await Promise.all([
    Issue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Issue.countDocuments(filter),
  ]);

  return {
    issues,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getIssueByIdFromDB = async (id: string) => {
  const issue = await Issue.findById(id);
  if (!issue) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Issue not found');
  }
  return issue;
};

const updateIssueStatusInDB = async (id: string, status: IssueStatus) => {
  const issue = await Issue.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  if (!issue) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Issue not found');
  }
  return issue;
};

const deleteIssueFromDB = async (id: string) => {
  const issue = await Issue.findByIdAndDelete(id);
  if (!issue) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Issue not found');
  }
  return issue;
};

export const IssueService = {
  reportIssueToDB,
  getAllIssuesFromDB,
  getIssueByIdFromDB,
  updateIssueStatusInDB,
  deleteIssueFromDB,
};
