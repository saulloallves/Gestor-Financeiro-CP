import { supabase } from './supabaseClient';
import type { 
  ConfiguracaoCobranca, 
  AtualizarConfiguracaoData,
  CalculoCobrancaParams,
  ResultadoCalculoCobranca
} from '../types/configuracoes';

class ConfiguracoesService {
  async obterConfiguracao(): Promise<ConfiguracaoCobranca> {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('Nenhuma configuração encontrada');
    }

    return {
      ...data,
      taxa_juros_diaria: Number(data.taxa_juros_diaria),
      valor_multa_atraso: Number(data.valor_multa_atraso),
      maximo_juros_acumulado: Number(data.maximo_juros_acumulado),
      desconto_antecipado: data.desconto_antecipado ? Number(data.desconto_antecipado) : null,
      dias_desconto_antecipado: data.dias_desconto_antecipado || null,
    };
  }

  async atualizarConfiguracao(dados: AtualizarConfiguracaoData): Promise<ConfiguracaoCobranca> {
    console.log('Dados enviados para atualização:', dados);
    
    // Primeiro, tentar buscar o registro existente
    const { data: existingData } = await supabase
      .from('configuracoes')
      .select('id')
      .single();

    let result;
    
    if (existingData) {
      // Se existe, fazer UPDATE
      result = await supabase
        .from('configuracoes')
        .update({
          ...dados,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id)
        .select()
        .single();
    } else {
      // Se não existe, fazer INSERT
      result = await supabase
        .from('configuracoes')
        .insert({
          ...dados,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      console.error('Erro do Supabase:', error);
      throw new Error(error.message);
    }

    return {
      ...data,
      taxa_juros_diaria: Number(data.taxa_juros_diaria),
      valor_multa_atraso: Number(data.valor_multa_atraso),
      maximo_juros_acumulado: Number(data.maximo_juros_acumulado),
      desconto_antecipado: data.desconto_antecipado ? Number(data.desconto_antecipado) : null,
      dias_desconto_antecipado: data.dias_desconto_antecipado || null,
    };
  }

  calcularValoresCobranca(params: CalculoCobrancaParams): ResultadoCalculoCobranca {
    const { valorOriginal, dataVencimento, dataCalculo = new Date().toISOString(), configuracao } = params;
    
    const dataVenc = new Date(dataVencimento);
    const dataCalc = new Date(dataCalculo);
    
    // Calcular dias de atraso considerando dias de graça
    const diasDiferenca = Math.floor((dataCalc.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24));
    const diasAtraso = Math.max(0, diasDiferenca - (configuracao.dias_graca || 0));
    
    let valorJuros = 0;
    let valorMulta = 0;
    let aplicarDesconto = false;
    let valorDesconto = 0;

    // Verificar se deve aplicar desconto por pagamento antecipado
    if (diasDiferenca < 0 && configuracao.desconto_antecipado && configuracao.dias_desconto_antecipado) {
      const diasAntecipacao = Math.abs(diasDiferenca);
      if (diasAntecipacao <= configuracao.dias_desconto_antecipado) {
        aplicarDesconto = true;
        valorDesconto = (valorOriginal * configuracao.desconto_antecipado) / 100;
      }
    }

    // Calcular juros e multa apenas se houver atraso
    if (diasAtraso > 0) {
      // Calcular multa (aplicada uma vez)
      valorMulta = (valorOriginal * configuracao.valor_multa_atraso) / 100;
      
      // Calcular juros diários
      valorJuros = valorOriginal * configuracao.taxa_juros_diaria * diasAtraso;
      
      // Aplicar limite máximo de juros
      const maxJuros = (valorOriginal * configuracao.maximo_juros_acumulado) / 100;
      valorJuros = Math.min(valorJuros, maxJuros);
    }

    const valorTotal = valorOriginal + valorJuros + valorMulta;
    const valorComDesconto = aplicarDesconto ? valorOriginal - valorDesconto : valorTotal;

    return {
      diasAtraso,
      valorJuros,
      valorMulta,
      valorTotal,
      aplicarDesconto,
      valorDesconto,
      valorComDesconto
    };
  }

  async testarConfiguracao(valorTeste: number = 1000, diasTeste: number = 30): Promise<ResultadoCalculoCobranca> {
    const configuracao = await this.obterConfiguracao();
    
    const dataVencimento = new Date();
    const dataCalculo = new Date();
    dataCalculo.setDate(dataCalculo.getDate() + diasTeste);

    return this.calcularValoresCobranca({
      valorOriginal: valorTeste,
      dataVencimento: dataVencimento.toISOString(),
      dataCalculo: dataCalculo.toISOString(),
      configuracao
    });
  }

  async verificarAmbienteAsaas(): Promise<'sandbox' | 'production'> {
    const configuracao = await this.obterConfiguracao();
    return configuracao.asaas_environment || 'sandbox';
  }

  async atualizarAmbienteAsaas(ambiente: 'sandbox' | 'production', updatedBy?: string): Promise<ConfiguracaoCobranca> {
    return this.atualizarConfiguracao({
      asaas_environment: ambiente,
      updated_by: updatedBy
    });
  }
}

export const configuracoesService = new ConfiguracoesService();
