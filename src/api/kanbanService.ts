import { supabase } from './supabaseClient';
import type { KanbanBoardData, KanbanStatus, KanbanTask } from '../types/kanban';
import { KANBAN_STATUSES } from '../types/kanban';

const statusTitles: Record<KanbanStatus, string> = {
  nova: 'Nova',
  em_contato_ia: 'Contato (IA)',
  em_negociacao_ia: 'Negociação (IA)',
  aguardando_pagamento: 'Aguardando Pagamento',
  agendamento_humano: 'Agendamento Humano',
  juridico: 'Jurídico',
  finalizada: 'Finalizada',
  perdida: 'Perdida',
};

class KanbanService {
  async getKanbanData(): Promise<KanbanBoardData> {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*')
      .in('status', ['pendente', 'em_aberto', 'atrasado', 'em_atraso', 'vencido', 'negociado', 'juridico'])
      .order('vencimento', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar dados do Kanban: ${error.message}`);
    }

    const tasks = data as KanbanTask[];

    // Inicializar o board com todas as colunas
    const columns: Record<KanbanStatus, { id: KanbanStatus; title: string; tasks: KanbanTask[] }> = 
      {} as Record<KanbanStatus, { id: KanbanStatus; title: string; tasks: KanbanTask[] }>;

    KANBAN_STATUSES.forEach(status => {
      columns[status] = {
        id: status,
        title: statusTitles[status],
        tasks: [],
      };
    });

    // Distribuir as tarefas nas colunas
    tasks.forEach(task => {
      const status = task.kanban_status as KanbanStatus || 'nova';
      if (columns[status]) {
        columns[status].tasks.push(task);
      }
    });

    return {
      columns,
      columnOrder: KANBAN_STATUSES,
    };
  }

  async updateCobrancaStatus(cobrancaId: string, novoStatus: KanbanStatus): Promise<void> {
    const { error } = await supabase
      .from('cobrancas')
      .update({ kanban_status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', cobrancaId);

    if (error) {
      throw new Error(`Erro ao atualizar status da cobrança: ${error.message}`);
    }
  }
}

export const kanbanService = new KanbanService();