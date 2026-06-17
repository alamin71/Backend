import { model, Schema } from 'mongoose';
import { IIssue } from './issue.interface';

const ISSUE_STATUSES = ['pending', 'in-progress', 'solved'] as const;

const issueSchema = new Schema<IIssue>(
  {
    issueId: {
      type: Number,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ISSUE_STATUSES,
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Auto-increment issueId before save
issueSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await Issue.countDocuments();
    this.issueId = count + 1;
  }
  next();
});

export const Issue = model<IIssue>('Issue', issueSchema);
