import { asaasService } from './asaasService';
import { supabase } from './supabaseClient';

export interface AtualizarUrlsData {
  id: string;
  asaas_payment_id: string;
}

export const urlsService = {
  /**
   * Tenta obter e atualizar as URLs de uma cobrança existente
   */
  async atualizarUrls(data: AtualizarUrlsData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Tentando atualizar URLs para pagamento:', data.asaas_payment_id);

      // Busca o payment completo para obter as URLs
      const payment = await asaasService.getPayment(data.asaas_payment_id);

      const updateData: { link_boleto?: string; link_pagamento?: string } = {};

      if (payment.bankSlipUrl) {
        updateData.link_boleto = payment.bankSlipUrl;
        console.log('✅ URL do boleto obtida:', payment.bankSlipUrl);
      } else {
        console.warn('⚠️ URL do boleto não encontrada no payment');
      }

      if (payment.invoiceUrl) {
        updateData.link_pagamento = payment.invoiceUrl;
        console.log('✅ URL de pagamento obtida:', payment.invoiceUrl);
      } else {
        console.warn('⚠️ URL de pagamento não encontrada no payment');
      }

      // Se obteve pelo menos uma URL, atualiza o registro
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('cobrancas')
          .update(updateData)
          .eq('id', data.id);

        if (error) {
          console.error('❌ Erro ao atualizar URLs no banco:', error);
          return { success: false, error: error.message };
        }

        console.log('✅ URLs atualizadas com sucesso no banco');
        return { success: true };
      } else {
        console.warn('⚠️ Nenhuma URL foi obtida com sucesso');
        return { success: false, error: 'Nenhuma URL foi obtida' };
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar URLs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  },

  /**
   * Tenta obter URLs para múltiplas cobranças sem URLs
   */
  async processarCobrancasSemUrls(): Promise<{ processadas: number; sucessos: number }> {
    try {
      console.log('🔍 Buscando cobranças sem URLs...');

      const { data: cobrancas, error } = await supabase
        .from('cobrancas')
        .select('id, asaas_payment_id')
        .not('asaas_payment_id', 'is', null)
        .or('link_boleto.is.null,link_pagamento.is.null');

      if (error) {
        console.error('❌ Erro ao buscar cobranças:', error);
        return { processadas: 0, sucessos: 0 };
      }

      if (!cobrancas || cobrancas.length === 0) {
        console.log('ℹ️ Nenhuma cobrança sem URLs encontrada');
        return { processadas: 0, sucessos: 0 };
      }

      console.log(`📋 Encontradas ${cobrancas.length} cobranças para processar`);

      let sucessos = 0;
      for (const cobranca of cobrancas) {
        const resultado = await this.atualizarUrls({
          id: cobranca.id,
          asaas_payment_id: cobranca.asaas_payment_id,
        });

        if (resultado.success) {
          sucessos++;
        }

        // Aguarda um pouco entre as requisições para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`✅ Processamento concluído: ${sucessos}/${cobrancas.length} sucessos`);
      return { processadas: cobrancas.length, sucessos };
    } catch (error) {
      console.error('❌ Erro no processamento em lote:', error);
      return { processadas: 0, sucessos: 0 };
    }
  }
};