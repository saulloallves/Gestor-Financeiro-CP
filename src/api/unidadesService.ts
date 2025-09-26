// Serviço de API para o módulo de Unidades
// REFATORADO PARA CONSULTAR TABELA LOCAL (RÉPLICA DA MATRIZ)

import { supabase } from "./supabaseClient";
import type {
  UnidadeFilter,
  UnidadeSort,
  UnidadePagination,
  UnidadeListResponse,
} from "../types/unidades";

class UnidadesService {
  /**
   * Buscar todas as unidades da tabela local
   */
  async getUnidades(
    filters: UnidadeFilter = {},
    sort: UnidadeSort = { field: "codigo_unidade", direction: "asc" },
    pagination: UnidadePagination = { page: 1, limit: 50 }
  ): Promise<UnidadeListResponse> {
    try {
      let query = supabase
        .from('unidades')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.nome_padrao) {
        query = query.ilike('nome_padrao', `%${filters.nome_padrao}%`);
      }
      if (filters.codigo_unidade) {
        query = query.eq('codigo_unidade', filters.codigo_unidade);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.uf) {
        query = query.eq('endereco_uf', filters.uf);
      }

      // Aplicar ordenação
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Aplicar paginação
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar unidades: ${error.message}`);
      }

      return {
        data: data || [],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pagination.limit),
        },
      };
    } catch (error) {
      console.error('❌ Erro no getUnidades:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar unidades');
    }
  }

  /**
   * Obter estatísticas das unidades
   */
  async getEstatisticas(): Promise<{
    total: number;
    operacao: number;
    implantacao: number;
    suspenso: number;
    cancelado: number;
  }> {
    const { data, error } = await supabase
      .from('unidades')
      .select('status', { count: 'exact' });

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data.length,
      operacao: data.filter(u => u.status === 'OPERAÇÃO').length,
      implantacao: data.filter(u => u.status === 'IMPLANTAÇÃO').length,
      suspenso: data.filter(u => u.status === 'SUSPENSO').length,
      cancelado: data.filter(u => u.status === 'CANCELADO').length,
    };

    return stats;
  }
}

export const unidadesService = new UnidadesService();