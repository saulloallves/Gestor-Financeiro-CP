export type TipoCobranca = 'royalties' | 'insumos' | 'aluguel' | 'eventual' | 'taxa_franquia';

export type StatusCobranca = 'pendente' | 'pago' | 'atrasado' | 'cancelado' | 'em_aberto' | 'negociado' | 'em_atraso' | 'vencido' | 'juridico' | 'parcelado';

// Novos tipos para integração ASAAS
export type TipoCliente = 'cpf' | 'cnpj';

export interface ClienteSelecionado {
  id: string | number;
  nome: string;
  documento: string; // CPF ou CNPJ
  email?: string;
  telefone?: string;
  tipo: TipoCliente;
}

export interface Cobranca {
  id: string;
  codigo_unidade: number;
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
  link_boleto?: string;
  created_by?: string;
  updated_by?: string;
  // Novos campos para integração ASAAS
  tipo_cliente?: TipoCliente;
  franqueado_id?: string;
  unidade_id?: number;
  criado_no_asaas?: boolean;
  link_pagamento?: string;
}

export interface CriarCobrancaData {
  codigo_unidade: number;
  tipo_cobranca: TipoCobranca;
  valor_original: number;
  valor_atualizado?: number;
  vencimento: string;
  status?: StatusCobranca;
  descricao?: string;
  observacoes?: string;
  juros_aplicado?: number;
  multa_aplicada?: number;
  dias_atraso?: number;
  asaas_payment_id?: string;
  asaas_customer_id?: string;
  boleto_id?: string;
  link_boleto?: string;
  // Novos campos para integração ASAAS
  tipo_cliente?: TipoCliente;
  franqueado_id?: string;
  unidade_id?: number;
  criar_no_asaas?: boolean;
  cliente_selecionado?: ClienteSelecionado;
  link_pagamento?: string;
}

// Novo tipo para dados do formulário estendido
export interface CobrancaFormData {
  codigo_unidade: number;
  tipo_cobranca: TipoCobranca;
  valor_original: number;
  vencimento: Date;
  observacoes?: string;
  // Campos específicos para integração ASAAS
  criar_no_asaas: boolean;
  tipo_cliente?: TipoCliente;
  franqueado_id?: string;
  unidade_id?: number;
  cliente_selecionado?: ClienteSelecionado;
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
  codigo_unidade?: number;
  tipo_cobranca?: TipoCobranca;
  status?: StatusCobranca;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  search?: string;
  updated_at_gte?: string;
}