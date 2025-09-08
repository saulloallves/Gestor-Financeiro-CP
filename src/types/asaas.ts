export interface AsaasCustomer {
  id?: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  observations?: string;
}

export interface AsaasPayment {
  id?: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: {
    value?: number;
    dueDateLimitDays?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value?: number;
    type?: 'PERCENTAGE';
  };
  fine?: {
    value?: number;
    type?: 'FIXED' | 'PERCENTAGE';
  };
  postalService?: boolean;
  split?: Array<{
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
  }>;
}

export interface AsaasPaymentResponse {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  subscription?: string;
  installment?: string;
  paymentLink?: string;
  dueDate: string;
  originalDueDate: string;
  value: number;
  netValue: number;
  originalValue?: number;
  interestValue?: number;
  description?: string;
  externalReference?: string;
  billingType: string;
  pixTransaction?: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  pixQrCodeId?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  creditDate?: string;
  estimatedCreditDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  invoiceNumber?: string;
  deleted: boolean;
  anticipated?: boolean;
  anticipable?: boolean;
  lastInvoiceViewedDate?: string;
  lastBankSlipViewedDate?: string;
  discount?: {
    value: number;
    limitDate?: string;
    dueDateLimitDays: number;
    type: string;
  };
  fine?: {
    value: number;
    type: string;
  };
  interest?: {
    value: number;
    type: string;
  };
  postalService?: boolean;
}

export interface AsaasInstallment {
  payment: string;
  installmentNumber: number;
  value: number;
  netValue: number;
  dueDate: string;
  description?: string;
  status: string;
}

export interface AsaasWebhookEvent {
  event: 'PAYMENT_CREATED' | 'PAYMENT_UPDATED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED' | 'PAYMENT_RESTORED' | 'PAYMENT_REFUNDED' | 'PAYMENT_RECEIVED_IN_CASH_UNDONE' | 'PAYMENT_CHARGEBACK_REQUESTED' | 'PAYMENT_CHARGEBACK_DISPUTE' | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL' | 'PAYMENT_DUNNING_RECEIVED' | 'PAYMENT_DUNNING_REQUESTED' | 'PAYMENT_BANK_SLIP_VIEWED' | 'PAYMENT_CHECKOUT_VIEWED';
  payment: AsaasPaymentResponse;
}

export interface AsaasApiError {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

export interface AsaasApiResponse<T> {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}
