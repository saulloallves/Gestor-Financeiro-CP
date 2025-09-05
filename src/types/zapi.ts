export type ZApiSendTextRequest = {
  phone: string;
  message: string;
};

export type ZApiSendTextResult = {
  id?: string;
  message?: string;
  error?: string;
  [k: string]: unknown;
};
