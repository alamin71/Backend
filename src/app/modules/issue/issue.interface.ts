import { Types } from 'mongoose';

export type IssueStatus = 'pending' | 'in-progress' | 'solved';

export interface IIssue {
  issueId: number;
  userId?: Types.ObjectId;
  subject: string;
  description: string;
  email: string;
  attachments: string[];
  status: IssueStatus;
}
