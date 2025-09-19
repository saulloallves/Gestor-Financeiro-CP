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
    console.log(`🏭 [ASAAS] createCustomer chamado com:`, JSON.stringify(customer, null, 2));
    
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

  // ================================
  // MÉTODOS AVANÇADOS PARA INTEGRAÇÃO
  // ================================

  /**
   * Buscar customer por CPF ou CNPJ
   */
  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
    try {
      const customers = await this.getCustomers({
        cpfCnpj: cpfCnpj,
        limit: 1,
      });

      return customers.data && customers.data.length > 0 ? customers.data[0] : null;
    } catch {
      console.log(`Customer com documento ${cpfCnpj} não encontrado no ASAAS`);
      return null;
    }
  }

  /**
   * Criar customer no ASAAS baseado em dados de franqueado (CPF)
   */
  async createCustomerFromFranqueado(franqueado: {
    nome: string;
    cpf: string;
    email?: string;
    telefone?: string;
    endereco_rua?: string;
    endereco_numero?: string;
    endereco_bairro?: string;
    endereco_cidade?: string;
    endereco_uf?: string;
    endereco_cep?: string;
  }): Promise<AsaasCustomer> {
    const customerData: AsaasCustomer = {
      name: franqueado.nome,
      cpfCnpj: franqueado.cpf,
      email: franqueado.email,
      phone: franqueado.telefone,
      mobilePhone: franqueado.telefone,
      // Endereço (se disponível)
      address: franqueado.endereco_rua,
      addressNumber: franqueado.endereco_numero,
      province: franqueado.endereco_bairro,
      city: franqueado.endereco_cidade,
      state: franqueado.endereco_uf,
      postalCode: franqueado.endereco_cep,
    };

    return await this.createCustomer(customerData);
  }

  /**
   * Criar customer no ASAAS baseado em dados de unidade (CNPJ)
   */
  async createCustomerFromUnidade(unidade: {
    nome_padrao: string;
    cnpj: string;
    email_comercial?: string;
    telefone_comercial?: string;
    endereco_rua?: string;
    endereco_numero?: string;
    endereco_bairro?: string;
    endereco_cidade?: string;
    endereco_uf?: string;
    endereco_cep?: string;
  }): Promise<AsaasCustomer> {
    const customerData: AsaasCustomer = {
      name: unidade.nome_padrao,
      cpfCnpj: unidade.cnpj,
      email: unidade.email_comercial,
      phone: unidade.telefone_comercial,
      mobilePhone: unidade.telefone_comercial,
      // Endereço (se disponível)
      address: unidade.endereco_rua,
      addressNumber: unidade.endereco_numero,
      province: unidade.endereco_bairro,
      city: unidade.endereco_cidade,
      state: unidade.endereco_uf,
      postalCode: unidade.endereco_cep,
    };

    return await this.createCustomer(customerData);
  }

  /**
   * Buscar ou criar customer no ASAAS (método principal para integração)
   */
  async findOrCreateCustomer(clienteData: {
    tipo: 'cpf' | 'cnpj';
    documento: string;
    nome: string;
    email?: string;
    telefone?: string;
    endereco?: {
      rua?: string;
      numero?: string;
      bairro?: string;
      cidade?: string;
      uf?: string;
      cep?: string;
    };
  }): Promise<{ customer: AsaasCustomer; isNew: boolean }> {
    console.log(`🔍 [ASAAS] Buscando customer com documento: ${clienteData.documento}`);
    console.log(`📋 [ASAAS] Dados do cliente:`, JSON.stringify(clienteData, null, 2));

    // Validações obrigatórias
    if (!clienteData.nome || clienteData.nome.trim() === '') {
      throw new Error('Nome do cliente é obrigatório para criar customer no ASAAS');
    }
    if (!clienteData.documento || clienteData.documento.trim() === '') {
      throw new Error('Documento do cliente é obrigatório para criar customer no ASAAS');
    }

    // 1. Tentar buscar customer existente
    const existingCustomer = await this.findCustomerByCpfCnpj(clienteData.documento);

    if (existingCustomer) {
      console.log(`✅ Customer encontrado no ASAAS: ${existingCustomer.id}`);
      return { customer: existingCustomer, isNew: false };
    }

    // 2. Se não encontrou, criar novo customer
    console.log(`➕ Criando novo customer no ASAAS para: ${clienteData.nome}`);
    
    // Preparar dados base (campos obrigatórios)
    const baseData: Partial<AsaasCustomer> = {
      name: clienteData.nome.trim(),
      cpfCnpj: clienteData.documento.trim(),
    };

    // Adicionar campos opcionais apenas se tiverem valor
    if (clienteData.email?.trim()) {
      baseData.email = clienteData.email.trim();
    }
    if (clienteData.telefone?.trim()) {
      baseData.phone = clienteData.telefone.trim();
      baseData.mobilePhone = clienteData.telefone.trim();
    }

    // Adicionar endereço se fornecido
    if (clienteData.endereco) {
      if (clienteData.endereco.rua?.trim()) baseData.address = clienteData.endereco.rua.trim();
      if (clienteData.endereco.numero?.trim()) baseData.addressNumber = clienteData.endereco.numero.trim();
      if (clienteData.endereco.bairro?.trim()) baseData.province = clienteData.endereco.bairro.trim();
      if (clienteData.endereco.cidade?.trim()) baseData.city = clienteData.endereco.cidade.trim();
      if (clienteData.endereco.uf?.trim()) baseData.state = clienteData.endereco.uf.trim();
      if (clienteData.endereco.cep?.trim()) baseData.postalCode = clienteData.endereco.cep.trim();
    }

    const customerData = baseData as AsaasCustomer;

    console.log(`📤 [ASAAS] CustomerData sendo enviado:`, JSON.stringify(customerData, null, 2));
    
    const newCustomer = await this.createCustomer(customerData);
    console.log(`✅ Customer criado no ASAAS: ${newCustomer.id}`);

    return { customer: newCustomer, isNew: true };
  }
}

export const asaasService = new AsaasService();
