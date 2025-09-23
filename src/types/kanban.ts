import type { Cobranca } from './cobrancas';

// O ENUM deve espelhar exatamente o que foi criado no banco de dados
export const KANBAN_STATUSES = [
  'nova',
  'em_contato_ia',
  'em_negociacao_ia',
  'aguardando_pagamento',
  'agendamento_humano',
  'juridico',
  'finalizada',
  'perdida'
] as const;

export type KanbanStatus = typeof KANBAN_STATUSES[number];

export interface KanbanTask extends Cobranca {
  // A interface Cobranca já tem tudo que precisamos
}

export interface KanbanColumnData {
  id: KanbanStatus;
  title: string;
  tasks: KanbanTask[];
}

export interface KanbanBoardData {
  columns: Record<KanbanStatus, KanbanColumnData>;
  columnOrder: KanbanStatus[];
}