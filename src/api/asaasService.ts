import type { 
  AsaasCustomer, 
  AsaasPayment, 
  AsaasPaymentResponse, 
  AsaasInstallment,
  AsaasApiResponse,
  AsaasApiError 
} from '../types/asaas';
import { configuracoesService } from './configuracoesService';

class AsaasService {
  private async getEnvironment(): Promise<'sandbox' | 'production'> {
    try {
      return await configuracoesService.verificarAmbienteAsaas();
    } catch (error) {
      console.warn('Erro ao obter ambiente ASAAS, usando sandbox como padrão:', error);
      return 'sandbox';
    }
  }

  private async getBaseUrl(): Promise<string> {
    const environment = await this.getEnvironment();
    return environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private getApiKey(): string {
    return import.meta.env.VITE_ASAAS_API_KEY || '';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': this.getApiKey(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = data as AsaasApiError;
        throw new Error(error.errors?.[0]?.description || 'Erro na API ASAAS');
      }

      return data;
    } catch (error) {
      console.error('Erro na requisição ASAAS:', error);
      throw error;
    }
  }

  async createCustomer(customer: AsaasCustomer): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>(`/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, customer: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    return this.makeRequest<AsaasCustomer>(`/customers/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async getCustomers(params?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    groupName?: string;
    externalReference?: string;
    offset?: number;
    limit?: number;
  }): Promise<AsaasApiResponse<AsaasCustomer>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';
    
    return this.makeRequest<AsaasApiResponse<AsaasCustomer>>(endpoint);
  }

  async createPayment(payment: AsaasPayment): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  async updatePayment(paymentId: string, payment: Partial<AsaasPayment>): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async deletePayment(paymentId: string): Promise<{ deleted: boolean; id: string }> {
    return this.makeRequest<{ deleted: boolean; id: string }>(`/payments/${paymentId}`, {
      method: 'DELETE',
    });
  }

  async getPayments(params?: {
    customer?: string;
    subscription?: string;
    installment?: string;
    paymentDate?: string;
    estimatedCreditDate?: string;
    dueDate?: string;
    dueDateGE?: string;
    dueDateLE?: string;
    user?: string;
    status?: string;
    billingType?: string;
    externalReference?: string;
    offset?: number;
    limit?: number;
  }): Promise<AsaasApiResponse<AsaasPaymentResponse>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/payments?${queryString}` : '/payments';
    
    return this.makeRequest<AsaasApiResponse<AsaasPaymentResponse>>(endpoint);
  }

  async getPaymentInstallments(paymentId: string): Promise<AsaasApiResponse<AsaasInstallment>> {
    return this.makeRequest<AsaasApiResponse<AsaasInstallment>>(`/payments/${paymentId}/installments`);
  }

  async getPixQrCode(paymentId: string): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
    return this.makeRequest<{ encodedImage: string; payload: string; expirationDate: string }>(`/payments/${paymentId}/pixQrCode`);
  }

  async confirmPaymentInCash(paymentId: string, data: {
    paymentDate?: string;
    value?: number;
    notifyCustomer?: boolean;
  }): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}/receiveInCash`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async undoReceivedInCash(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}/undoReceivedInCash`, {
      method: 'POST',
    });
  }

  async refundPayment(paymentId: string, data: {
    value?: number;
    description?: string;
  }): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createInstallments(data: {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    installmentCount: number;
    totalValue?: number;
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
  }): Promise<AsaasApiResponse<AsaasPaymentResponse>> {
    return this.makeRequest<AsaasApiResponse<AsaasPaymentResponse>>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentUrl(paymentId: string): Promise<string> {
    const baseUrl = await this.getBaseUrl();
    return `${baseUrl}/payments/${paymentId}/invoiceUrl`;
  }

  async getBankSlipUrl(paymentId: string): Promise<string> {
    const baseUrl = await this.getBaseUrl();
    return `${baseUrl}/payments/${paymentId}/bankSlipUrl`;
  }
}

export const asaasService = new AsaasService();
