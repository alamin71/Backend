export type ICreateAccount = {
  name: string;
  email: string;
  otp: string | number;
  audience?: 'user' | 'admin';
};

export type IResetPassword = {
  email: string;
  otp: string | number;
  audience?: 'user' | 'admin';
};
export interface IResetPasswordByEmail {
  email: string;
  resetUrl: string;
  audience?: 'user' | 'admin';
}
export interface IHelpContact {
  name: string;
  email: string;
  phone?: string;
  read: boolean;
  message: string;
}
export type IContact = {
  name: string;
  email: string;
  subject: string;
  message: string;
};
export type IEmailChangeOtp = {
  name: string;
  otp: string | number;
  newEmail: string;
};
