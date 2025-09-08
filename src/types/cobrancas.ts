export type TipoCobranca = 'royalties' | 'insumos' | 'aluguel' | 'eventual';

export type StatusCobranca = 'pendente' | 'pago' | 'atrasado' | 'cancelado' | 'em_aberto' | 'negociado' | 'em_atraso' | 'vencido' | 'juridico' | 'parcelado';

export interface Cobranca {
  id: string;
  unidade_id: string;
  tipo_cobranca: TipoCobranca;
  valor_original: number;
  valor_atualizado: number;
  vencimento: string;
  status: StatusCobranca;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  juros_aplicado: number;
  multa_aplicada: number;
  dias_atraso: number;
  asaas_customer_id?: string;
  asaas_payment_id?: string;
  boleto_id?: string;
  boleto_url?: string;
  link_pagamento?: string;
  link_boleto?: string;
  created_by?: string;
  updated_by?: string;
  unidade?: {
    id: string;
    codigo_unidade: string;
    nome_padrao: string;
    franqueado?: {
      id: string;
      nome: string;
      email: string;
      telefone: string;
      cnpj: string;
      asaas_customer_id?: string;
    };
  };
}

export interface CriarCobrancaData {
  unidade_id: string;
  tipo_cobranca: TipoCobranca;
  valor_original: number;
  vencimento: string;
  descricao?: string;
  observacoes?: string;
}

export interface EditarCobrancaData {
  tipo_cobranca?: TipoCobranca;
  valor_original?: number;
  vencimento?: string;
  observacoes?: string;
}

export interface NegociacaoCobranca {
  id: string;
  cobranca_id: string;
  tipo_negociacao: 'parcelamento' | 'prorrogacao' | 'desconto';
  valor_negociado: number;
  parcelas?: number;
  nova_data_vencimento?: string;
  observacoes?: string;
  status: 'proposta' | 'aceita' | 'rejeitada';
  data_criacao: string;
}

export interface CobrancasFilters {
  unidade_id?: string;
  tipo_cobranca?: TipoCobranca;
  status?: StatusCobranca;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  valor_minimo?: number;
  valor_maximo?: number;
}
