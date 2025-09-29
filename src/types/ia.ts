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

// Novo tipo para mensagens de chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Tipos para a tabela ia_prompts
export interface IaPrompt {
  id: string;
  nome_agente: string;
  prompt_base: string;
  modelo_ia: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface IaPromptUpdate {
  prompt_base?: string;
  modelo_ia?: string;
  ativo?: boolean;
}