import {
  IContact,
  ICreateAccount,
  IHelpContact,
  IResetPassword,
  IResetPasswordByEmail,
  IEmailChangeOtp,
} from '../types/emailTemplate';

const BRAND_NAME = 'No Shots';
const BRAND_COLOR = '#F5C518';
const BRAND_DARK = '#111111';
const LOGO_URL = 'https://noshorts-bucket.s3.eu-north-1.amazonaws.com/logo.png';

const header = () => `
  <div style="background-color:${BRAND_DARK};padding:24px;text-align:center;border-radius:10px 10px 0 0;">
    <img src="${LOGO_URL}" alt="${BRAND_NAME}" width="120" height="50"
      style="display:block;margin:0 auto 8px;object-fit:contain;" />
    <span style="color:${BRAND_COLOR};font-size:22px;font-weight:bold;letter-spacing:3px;display:block;">${BRAND_NAME.toUpperCase()}</span>
  </div>`;

const footer = () => `
  <div style="text-align:center;padding:20px;color:#888;font-size:13px;">
    <p>© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
    <p>If you did not request this email, please ignore it.</p>
  </div>`;

const wrapper = (content: string) => `
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
    ${header()}
    <div style="padding:32px 40px;">
      ${content}
    </div>
    ${footer()}
  </div>
</body>`;

const otpBox = (otp: number | string) =>
  `<div style="background-color:${BRAND_DARK};color:${BRAND_COLOR};font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center;padding:16px;border-radius:8px;margin:24px 0;">${otp}</div>`;

// ─── Templates ────────────────────────────────────────────────────────────────

const createAccount = (values: ICreateAccount) => {
  const audienceLabel = values.audience === 'admin' ? 'Admin' : 'User';
  return {
    to: values.email,
    subject: `${BRAND_NAME} – Verify your account`,
    html: wrapper(`
      <h2 style="color:${BRAND_DARK};margin-top:0;">Welcome, ${values.name}!</h2>
      <p style="color:#555;font-size:15px;">Account Type: <strong>${audienceLabel}</strong></p>
      <p style="color:#555;font-size:15px;">Use the OTP below to verify your account:</p>
      ${otpBox(values.otp)}
      <p style="color:#888;font-size:13px;">This OTP is valid for <strong>3 minutes</strong>.</p>
    `),
  };
};

const resetPassword = (values: IResetPassword) => {
  const audienceLabel = values.audience === 'admin' ? 'Admin' : 'User';
  return {
    to: values.email,
    subject: `${BRAND_NAME} – Reset your password`,
    html: wrapper(`
      <h2 style="color:${BRAND_DARK};margin-top:0;">Password Reset</h2>
      <p style="color:#555;font-size:15px;">Account Type: <strong>${audienceLabel}</strong></p>
      <p style="color:#555;font-size:15px;">Use the OTP below to reset your password:</p>
      ${otpBox(values.otp)}
      <p style="color:#888;font-size:13px;">This OTP is valid for <strong>3 minutes</strong>.</p>
      <p style="color:#888;font-size:13px;">If you did not request a password reset, you can safely ignore this email.</p>
    `),
  };
};

const resetPasswordByUrl = (values: IResetPasswordByEmail) => ({
  to: values.email,
  subject: `${BRAND_NAME} – Reset your password`,
  html: wrapper(`
    <h2 style="color:${BRAND_DARK};margin-top:0;">Reset Your Password</h2>
    <p style="color:#555;font-size:15px;">We received a request to reset your password. Click the button below:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${values.resetUrl}" target="_blank"
        style="background-color:${BRAND_COLOR};color:${BRAND_DARK};text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;">
        Reset Password
      </a>
    </div>
    <p style="color:#888;font-size:13px;">This link will expire in <strong>10 minutes</strong>.</p>
    <p style="color:#888;font-size:13px;">If you didn't request this, you can ignore this email.</p>
  `),
});

const contact = (values: IContact) => ({
  to: values.email,
  subject: `${BRAND_NAME} – We received your message`,
  html: wrapper(`
    <h2 style="color:${BRAND_DARK};margin-top:0;">Hi ${values.name},</h2>
    <p style="color:#555;font-size:15px;">Thanks for contacting us. We have received your message and our team will respond as soon as possible.</p>
    <div style="background:#f8f8f8;border-left:4px solid ${BRAND_COLOR};padding:16px;border-radius:4px;margin:20px 0;">
      <p style="margin:4px 0;color:#333;"><strong>Subject:</strong> ${values.subject}</p>
      <p style="margin:4px 0;color:#333;"><strong>Message:</strong> ${values.message}</p>
    </div>
    <p style="color:#888;font-size:13px;">If your inquiry is urgent, please contact us at <a href="mailto:noshots05@gmail.com" style="color:${BRAND_COLOR};">noshots05@gmail.com</a>.</p>
  `),
});

const contactFormTemplate = (values: IHelpContact) => ({
  to: values.email,
  subject: `${BRAND_NAME} – We received your request`,
  html: wrapper(`
    <h2 style="color:${BRAND_DARK};margin-top:0;">Hello ${values.name},</h2>
    <p style="color:#555;font-size:15px;">Thanks for reaching out. We have received your message:</p>
    <div style="background:#f8f8f8;border-left:4px solid ${BRAND_COLOR};padding:16px;border-radius:4px;margin:20px 0;">
      <p style="color:#555;font-size:15px;">"${values.message}"</p>
    </div>
    <p style="color:#555;font-size:14px;">Email: ${values.email}</p>
    <p style="color:#555;font-size:14px;">Phone: ${values.phone}</p>
    <p style="color:#888;font-size:13px;">We will get back to you as soon as possible.</p>
  `),
});

const emailChangeOtp = (values: IEmailChangeOtp) => ({
  to: values.newEmail,
  subject: `${BRAND_NAME} – Email change verification`,
  html: wrapper(`
    <h2 style="color:${BRAND_DARK};margin-top:0;">Email Change Verification</h2>
    <p style="color:#555;font-size:15px;">Hi ${values.name},</p>
    <p style="color:#555;font-size:15px;">Use the OTP below to verify your new email address:</p>
    ${otpBox(values.otp)}
    <p style="color:#888;font-size:13px;">This OTP is valid for <strong>5 minutes</strong>.</p>
    <p style="color:#888;font-size:13px;">If you did not request this change, please ignore this email — your account will remain unchanged.</p>
  `),
});

export const emailTemplate = {
  createAccount,
  resetPassword,
  resetPasswordByUrl,
  contactFormTemplate,
  contact,
  emailChangeOtp,
};
