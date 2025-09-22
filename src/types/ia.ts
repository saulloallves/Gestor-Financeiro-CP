export type CategoriaConhecimento = 'cobrancas' | 'juridico' | 'negociacoes' | 'relatorios' | 'suporte';
export type StatusConhecimento = 'ativo' | 'inativo';
export type IAProvider = 'openai' | 'lambda';

export interface BaseConhecimento {
  id: string;
  titulo: string;
  categoria: CategoriaConhecimento;
  conteudo: string;
  palavras_chave?: string[];
  status: StatusConhecimento;
  criado_por?: string;
  data_criacao: string;
  ultima_atualizacao: string;
}

export type CriarBaseConhecimento = Omit<BaseConhecimento, 'id' | 'data_criacao' | 'ultima_atualizacao' | 'criado_por'>;
