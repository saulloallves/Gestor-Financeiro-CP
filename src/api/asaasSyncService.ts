import { supabase } from './supabaseClient';
import { asaasService } from './asaasService';
import type { Cobranca } from '../types/cobrancas';
import type { AsaasPaymentResponse, AsaasCustomer } from '../types/asaas';

interface SyncResult {
  created: number;
  updated: number;
  errors: string[];
}

interface SyncParams {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

class AsaasSyncService {
  /**
   * Sincroniza todos os payments do ASAAS com o banco local
   */
  async syncAllPayments(params?: SyncParams): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, errors: [] };

    try {
      console.log('🔄 Iniciando sincronização de payments ASAAS...');
      
      // Buscar payments do ASAAS
      const asaasResponse = await asaasService.getPayments({
        dueDateGE: params?.dateFrom,
        dueDateLE: params?.dateTo,
        limit: params?.limit || 100,
        offset: params?.offset || 0
      });

      const payments = asaasResponse.data;
      console.log(`📊 Encontrados ${payments.length} payments no ASAAS`);

      for (const payment of payments) {
        try {
          // Verificar se já existe no banco
          const { data: existing } = await supabase
            .from('cobrancas')
            .select('id, status, valor_atualizado')
            .eq('asaas_payment_id', payment.id)
            .single();

          await this.syncSinglePayment(payment);
          
          if (existing) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          result.errors.push(`Payment ${payment.id}: ${errorMessage}`);
          console.error(`❌ Erro ao sincronizar payment ${payment.id}:`, errorMessage);
        }
      }

      console.log(`✅ Sincronização concluída: ${result.created} criadas, ${result.updated} atualizadas, ${result.errors.length} erros`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro na sincronização geral:', errorMessage);
      throw new Error(`Erro na sincronização: ${errorMessage}`);
    }
  }

  /**
   * Sincroniza um payment específico
   */
  async syncSinglePayment(payment: AsaasPaymentResponse): Promise<Cobranca> {
    try {
      // Extrair dados essenciais
      const codigoUnidade = this.extractUnidadeCode(payment);
      const status = this.mapAsaasStatus(payment.status);
      const diasAtraso = this.calculateDaysOverdue(payment.dueDate);
      
      // Verificar se já existe no banco
      const { data: existing } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('asaas_payment_id', payment.id)
        .single();

      const cobrancaData = {
        codigo_unidade: codigoUnidade,
        tipo_cobranca: this.extractTipoCobranca(payment),
        valor_original: payment.originalValue || payment.value,
        valor_atualizado: payment.value,
        vencimento: payment.dueDate,
        status,
        observacoes: payment.description || '',
        asaas_payment_id: payment.id,
        asaas_customer_id: payment.customer,
        boleto_id: payment.billingType === 'BOLETO' ? payment.id : null,
        link_boleto: payment.bankSlipUrl || null,
        juros_aplicado: payment.interestValue || 0,
        multa_aplicada: payment.fine?.value || 0,
        dias_atraso: diasAtraso,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('cobrancas')
          .update(cobrancaData)
          .eq('asaas_payment_id', payment.id)
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        return data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('cobrancas')
          .insert({
            ...cobrancaData,
            created_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (error) throw new Error(error.message);
        return data;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao sincronizar payment ${payment.id}: ${errorMessage}`);
    }
  }

  /**
   * Mapeia status do ASAAS para nosso sistema
   */
  private mapAsaasStatus(asaasStatus: string): Cobranca['status'] {
    const statusMap: Record<string, Cobranca['status']> = {
      'PENDING': 'pendente',
      'RECEIVED': 'pago',
      'CONFIRMED': 'pago',
      'OVERDUE': 'vencido',
      'REFUNDED': 'cancelado',
      'RECEIVED_IN_CASH': 'pago',
      'AWAITING_CHARGEBACK_REVERSAL': 'pendente',
      'DUNNING_RECEIVED': 'pago',
      'AWAITING_RISK_ANALYSIS': 'pendente'
    };

    return statusMap[asaasStatus] || 'pendente';
  }

  /**
   * Extrai código da unidade do payment
   */
  private extractUnidadeCode(payment: AsaasPaymentResponse): number {
    // Tentar extrair do externalReference primeiro
    if (payment.externalReference) {
      const match = payment.externalReference.match(/UN(\d+)/);
      if (match) return parseInt(match[1]);
    }
    
    // Fallback: extrair da description
    if (payment.description) {
      const match = payment.description.match(/unidade[:\s]*(\d+)/i);
      if (match) return parseInt(match[1]);
    }
    
    // Default para unidade 1 se não conseguir extrair
    console.warn(`⚠️ Não foi possível extrair código da unidade do payment ${payment.id}. Usando unidade 1 como padrão.`);
    return 1;
  }

  /**
   * Extrai tipo de cobrança baseado na description
   */
  private extractTipoCobranca(payment: AsaasPaymentResponse): Cobranca['tipo_cobranca'] {
    const description = payment.description?.toLowerCase() || '';
    
    if (description.includes('royalt')) return 'royalties';
    if (description.includes('insumo')) return 'insumos';
    if (description.includes('aluguel')) return 'aluguel';
    if (description.includes('taxa')) return 'taxa_franquia';
    
    return 'eventual';
  }

  /**
   * Calcula dias de atraso
   */
  private calculateDaysOverdue(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    
    // Zerar as horas para comparação apenas de data
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Sincroniza status de todas as cobranças com ASAAS
   */
  async syncAllStatuses(): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, errors: [] };

    try {
      console.log('🔄 Iniciando sincronização de status...');

      // Buscar cobranças com asaas_payment_id que não estão como 'pago' ou 'cancelado'
      const { data: cobrancas, error } = await supabase
        .from('cobrancas')
        .select('*')
        .not('asaas_payment_id', 'is', null)
        .not('status', 'in', '("pago","cancelado")');

      if (error) throw new Error(error.message);

      console.log(`📊 Encontradas ${cobrancas?.length || 0} cobranças para sincronizar`);

      for (const cobranca of cobrancas || []) {
        try {
          const payment = await asaasService.getPayment(cobranca.asaas_payment_id!);
          const newStatus = this.mapAsaasStatus(payment.status);
          const diasAtraso = this.calculateDaysOverdue(payment.dueDate);
          
          // Verificar se houve mudanças significativas
          const hasChanges = newStatus !== cobranca.status || 
                           payment.value !== cobranca.valor_atualizado ||
                           diasAtraso !== cobranca.dias_atraso;

          if (hasChanges) {
            await supabase
              .from('cobrancas')
              .update({ 
                status: newStatus,
                valor_atualizado: payment.value,
                dias_atraso: diasAtraso,
                juros_aplicado: payment.interestValue || 0,
                multa_aplicada: payment.fine?.value || 0,
                boleto_id: payment.billingType === 'BOLETO' ? payment.id : cobranca.boleto_id,
                link_boleto: payment.bankSlipUrl || cobranca.link_boleto,
                updated_at: new Date().toISOString()
              })
              .eq('id', cobranca.id);

            result.updated++;
            console.log(`✅ Status atualizado para cobrança ${cobranca.id}: ${cobranca.status} → ${newStatus}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          result.errors.push(`Cobrança ${cobranca.id}: ${errorMessage}`);
          console.error(`❌ Erro ao sincronizar cobrança ${cobranca.id}:`, errorMessage);
        }
      }

      console.log(`✅ Sincronização de status concluída: ${result.updated} atualizadas, ${result.errors.length} erros`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro na sincronização de status:', errorMessage);
      throw new Error(`Erro ao sincronizar status: ${errorMessage}`);
    }
  }

  /**
   * Sincroniza payments de um período específico
   */
  async syncPaymentsByDateRange(dateFrom: string, dateTo: string): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, errors: [] };
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      try {
        const batchResult = await this.syncAllPayments({
          dateFrom,
          dateTo,
          limit,
          offset
        });

        result.created += batchResult.created;
        result.updated += batchResult.updated;
        result.errors.push(...batchResult.errors);

        // Se retornou menos que o limit, não há mais registros
        hasMore = batchResult.created + batchResult.updated >= limit;
        offset += limit;

        // Evitar loop infinito
        if (offset > 10000) {
          console.warn('⚠️ Limite de 10.000 registros atingido. Interrompendo sincronização.');
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        result.errors.push(`Batch offset ${offset}: ${errorMessage}`);
        break;
      }
    }

    return result;
  }

  /**
   * Busca um customer no ASAAS por CPF/CNPJ
   */
  async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
    try {
      const customers = await asaasService.getCustomers({
        cpfCnpj: cpfCnpj.replace(/\D/g, '') // Remove caracteres não numéricos
      });

      return customers.data.length > 0 ? customers.data[0] : null;
    } catch (error) {
      console.error('❌ Erro ao buscar customer no ASAAS:', error);
      return null;
    }
  }
}

export const asaasSyncService = new AsaasSyncService();