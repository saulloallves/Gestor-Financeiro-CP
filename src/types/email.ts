export type BrevoSendEmailRequest = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
};

export type BrevoSendEmailResult = {
  messageId?: string;
  [k: string]: unknown;
};

export type EmailRecipient = {
  email: string;
  name?: string;
};

export type EmailTemplate = {
  subject: string;
  html: string;
  text?: string;
};
