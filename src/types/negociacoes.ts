import type { Cobranca } from './cobrancas';
import type { Franqueado } from './franqueados';

export type NegociacaoStatus = 'em_andamento' | 'aceita' | 'recusada' | 'escalada' | 'cancelada';

export interface InteracaoNegociacao {
  id: string;
  negociacao_id: string;
  mensagem_enviada?: string;
  mensagem_recebida?: string;
  data_hora: string;
}

export interface Negociacao {
  id: string;
  cobranca_id: string;
  franqueado_id: string;
  status: NegociacaoStatus;
  proposta_json?: any;
  aceite?: boolean;
  data_inicio: string;
  data_encerramento?: string;
  ultima_interacao: string;
  created_at: string;
  updated_at: string;
  
  // Campos de join
  cobrancas: Pick<Cobranca, 'id' | 'valor_atualizado' | 'codigo_unidade'>;
  franqueados: Pick<Franqueado, 'id' | 'nome'>;
}