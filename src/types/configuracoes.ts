export interface ConfiguracaoCobranca {
  id: string;
  taxa_juros_diaria: number;
  valor_multa_atraso: number;
  dias_graca: number;
  maximo_juros_acumulado: number;
  desconto_antecipado: number | null;
  dias_desconto: number | null;
  asaas_webhook_url: string | null;
  asaas_environment: 'sandbox' | 'production';
  dias_lembrete_previo: number | null;
  dias_escalonamento_juridico: number | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface AtualizarConfiguracaoData {
  taxa_juros_diaria?: number;
  valor_multa_atraso?: number;
  dias_graca?: number;
  maximo_juros_acumulado?: number;
  desconto_antecipado?: number | null;
  dias_desconto?: number | null;
  asaas_webhook_url?: string | null;
  asaas_environment?: 'sandbox' | 'production';
  dias_lembrete_previo?: number | null;
  dias_escalonamento_juridico?: number | null;
  updated_by?: string | null;
}

export interface CalculoCobrancaParams {
  valorOriginal: number;
  dataVencimento: string;
  dataCalculo?: string;
  configuracao: ConfiguracaoCobranca;
}

export interface ResultadoCalculoCobranca {
  diasAtraso: number;
  valorJuros: number;
  valorMulta: number;
  valorTotal: number;
  aplicarDesconto: boolean;
  valorDesconto: number;
  valorComDesconto: number;
}
