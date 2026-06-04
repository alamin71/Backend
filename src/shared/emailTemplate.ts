import {
  IContact,
  ICreateAccount,
  IHelpContact,
  IResetPassword,
  IResetPasswordByEmail,
  IEmailChangeOtp,
} from '../types/emailTemplate';

const LOGO_URL =
  'https://bradmarquis-bucket.s3.us-east-1.amazonaws.com/brand_logo.png';

const createAccount = (values: ICreateAccount) => {
  const audienceLabel = values.audience === 'admin' ? 'Admin' : 'User';
  const data = {
    to: values.email,
    subject: `${audienceLabel} account verification OTP`,
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
        <img src="${LOGO_URL}" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px;">Welcome ${values.name}!</h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 14px; font-weight: 600; margin-bottom: 10px;">Account Type: ${audienceLabel}</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Use this OTP to verify your account:</p>
            <div style="background-color: #277E16; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This OTP is valid for 3 minutes.</p>
            <p style="color: #777; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">If you did not request this, please ignore this email.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};
const contact = (values: IContact) => {
  const data = {
    to: values.email,
    subject: 'We received your message',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">      
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <img src="${LOGO_URL}" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
          <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px; text-align: center;">Hi ${values.name}, thanks for contacting us.</h2>
          
          <p style="color: #555; font-size: 16px; line-height: 1.5; text-align: center;">
              We have received your message. Our team will respond as soon as possible.
          </p>
          
          <div style="padding: 15px; background-color: #f4f4f4; border-radius: 8px; margin: 20px 0;">
              <p style="color: #333; font-size: 16px; font-weight: bold;">Your Message Details:</p>
              <p><strong>Name:</strong> ${values.name}</p>
              <p><strong>Email:</strong> ${values.email}</p>
              <p><strong>Subject:</strong> ${values.subject}</p>
              <br/>
              <p><strong>Message:</strong> ${values.message}</p>
          </div>

          <p style="color: #555; font-size: 14px; text-align: center;">
              If your inquiry is urgent, feel free to reach out to us directly at 
              <a href="mailto:support@yourdomain.com" style="color: #277E16; text-decoration: none;">support@yourdomain.com</a>.
          </p>

          <p style="color: #555; font-size: 14px; text-align: center; margin-top: 20px;">
              Best Regards, <br/>
              Support Team
          </p>
      </div>
  </body>`,
  };
  return data;
};
const resetPassword = (values: IResetPassword) => {
  const audienceLabel = values.audience === 'admin' ? 'Admin' : 'User';
  const data = {
    to: values.email,
    subject: `${audienceLabel} reset password OTP`,
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    <img src="${LOGO_URL}" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
      <p style="color: #555; font-size: 14px; font-weight: 600; margin-bottom: 10px;">Account Type: ${audienceLabel}</p>
      <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Use this OTP to reset your password:</p>
            <div style="background-color: #277E16; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
      <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This OTP is valid for 3 minutes.</p>
        <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;text-align:left">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};
const resetPasswordByUrl = (values: IResetPasswordByEmail) => {
  const data = {
    to: values.email,
    subject: 'Password reset link',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
      <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <img src="${LOGO_URL}" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to reset it:</p>
          <a href="${values.resetUrl}" target="_blank" style="display: inline-block; background-color: #277E16; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 18px; margin: 20px auto;">Reset Password</a>
          <p style="color: #555; font-size: 16px; line-height: 1.5; margin-top: 20px;">If you didn’t request this, you can ignore this email.</p>
          <p style="color: #b9b4b4; font-size: 14px;">This link will expire in 10 minutes.</p>
        </div>
      </div>
    </body>`,
  };
  return data;
};

const contactFormTemplate = (values: IHelpContact) => {
  const data = {
    to: values.email,
    subject: 'Thanks, we received your request',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    <img src="${LOGO_URL}" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello ${values.name},</p>
      <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Thanks for contacting us. We have received your message:</p>
            <div style="background-color: #f1f1f1; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;">
                <p style="color: #555; font-size: 16px; line-height: 1.5;">"${values.message}"</p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We will get back to you as soon as possible. Below are the details you provided:</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Email: ${values.email}</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 10px;">Phone: ${values.phone}</p>
            <p style="color: #b9b4b4; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">If you need immediate assistance, please feel free to contact us directly at our support number.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};

const emailChangeOtp = (values: IEmailChangeOtp) => {
  const data = {
    to: values.newEmail,
    subject: 'Email change verification OTP',
    html: `<body style="font-family: Arial, sans-serif; background-color: #f9f9f9; margin: 50px; padding: 20px; color: #555;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center;">
        <img src="${LOGO_URL}" alt="Logo" style="display: block; margin: 0 auto 20px; width:150px" />
        <h2 style="color: #277E16; font-size: 24px; margin-bottom: 20px;">Email Change Verification</h2>
        <div style="text-align: center;">
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hi ${values.name},</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Use this OTP to verify your new email address:</p>
            <div style="background-color: #277E16; width: 120px; padding: 10px; text-align: center; border-radius: 8px; color: #fff; font-size: 25px; letter-spacing: 2px; margin: 20px auto;">${values.otp}</div>
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">This OTP is valid for 5 minutes.</p>
            <p style="color: #777; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">If you did not request this email change, please ignore this email and your account will remain unchanged.</p>
        </div>
    </div>
</body>`,
  };
  return data;
};

export const emailTemplate = {
  createAccount,
  resetPassword,
  resetPasswordByUrl,
  contactFormTemplate,
  contact,
  emailChangeOtp,
};
