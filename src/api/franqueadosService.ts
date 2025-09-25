// Serviço de API para o módulo de Franqueados
// REFATORADO PARA CONSULTAR TABELA LOCAL (RÉPLICA DA MATRIZ)

import { supabase } from "./supabaseClient";
import type {
  Franqueado,
  FranqueadoFilter,
  FranqueadoSort,
  FranqueadoPagination,
  FranqueadoListResponse,
} from "../types/franqueados";

class FranqueadosService {
  /**
   * Buscar todos os franqueados da tabela local
   */
  async getFranqueados(
    filters: FranqueadoFilter = {},
    sort: FranqueadoSort = { field: "nome", direction: "asc" },
    pagination: FranqueadoPagination = { page: 1, limit: 50 }
  ): Promise<FranqueadoListResponse> {
    try {
      let query = supabase
        .from('franqueados')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters.nome) {
        query = query.or(`nome.ilike.%${filters.nome}%,cpf.ilike.%${filters.nome}%,email.ilike.%${filters.nome}%`);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.tipo && filters.tipo.length > 0) {
        query = query.in('tipo', filters.tipo);
      }

      // Aplicar ordenação
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Aplicar paginação
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar franqueados: ${error.message}`);
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
      console.error('❌ Erro no getFranqueados:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar franqueados');
    }
  }

  /**
   * Obter estatísticas dos franqueados
   */
  async getEstatisticas(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    principais: number;
  }> {
    const { data, error } = await supabase
      .from('franqueados')
      .select('status, tipo', { count: 'exact' });

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data.length,
      ativos: data.filter(f => f.status === 'ativo').length,
      inativos: data.filter(f => f.status === 'inativo').length,
      principais: data.filter(f => f.tipo === 'principal').length,
    };

    return stats;
  }
}

export const franqueadosService = new FranqueadosService();