import { supabase } from './supabaseClient'; // Importe o cliente Supabase
import type { 
  AsaasCustomer, 
  AsaasPayment, 
  AsaasPaymentResponse, 
  AsaasInstallment,
  AsaasApiResponse,
  AsaasApiError 
} from '../types/asaas';

class AsaasService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    console.log(`[CLIENT] Invocando Edge Function 'asaas-proxy' para o endpoint: ${endpoint}`);

    try {
      const { data, error } = await supabase.functions.invoke('asaas-proxy', {
        body: { endpoint, options },
      });

      if (error) {
        // Erros de rede ou da própria Edge Function
        throw new Error(`Erro ao invocar a Edge Function: ${error.message}`);
      }

      if (data.error) {
        // Erros de lógica ou vindos da API do ASAAS
        throw new Error(data.error);
      }
      
      // Se a API do ASAAS retornou um erro (ex: 401, 404), ele será encapsulado aqui
      if (data.errors) {
        const apiError = data as AsaasApiError;
        throw new Error(apiError.errors[0].description);
      }

      return data as T;
    } catch (err) {
      console.error(`❌ [CLIENT] Falha na chamada para 'asaas-proxy':`, err);
      throw err;
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

  // Obter URL do boleto bancário
  async getBankSlipUrl(paymentId: string): Promise<string> {
    const response = await this.makeRequest<{ identificationField: string }>(`/payments/${paymentId}/bankSlipUrl`, {
      method: 'GET',
    });
    return response.identificationField;
  }

  // Obter URL da página de pagamento
  async getPaymentUrl(paymentId: string): Promise<string> {
    const response = await this.makeRequest<{ invoiceUrl: string }>(`/payments/${paymentId}/invoiceUrl`, {
      method: 'GET',
    });
    return response.invoiceUrl;
  }
}

export const asaasService = new AsaasService();
