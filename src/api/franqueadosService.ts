// Serviço de API para o módulo de Franqueados
// REFATORADO PARA USAR BANCO MATRIZ (SOMENTE LEITURA)

import { supabaseMatriz } from "./supabaseMatrizClient";
import { supabase } from "./supabaseClient"; // Para operações no banco local
import type {
  Franqueado,
  FranqueadoFilter,
  FranqueadoSort,
  FranqueadoPagination,
  FranqueadoListResponse,
} from "../types/franqueados";
import type {
  VFranqueadosUnidadesDetalhes,
} from "../types/matriz";
import { 
  mapearFranqueadoMatriz, 
  mapearFiltrosFranqueado 
} from "../utils/matrizMappers";

class FranqueadosService {
  // ================================
  // CONSULTAS (BANCO MATRIZ - SOMENTE LEITURA)
  // ================================

  /**
   * Buscar todos os franqueados do banco matriz
   */
  async getFranqueados(
    filters: FranqueadoFilter = {},
    sort: FranqueadoSort = { field: "nome", direction: "asc" },
    pagination: FranqueadoPagination = { page: 1, limit: 50 }
  ): Promise<FranqueadoListResponse> {
    try {
      console.log('🔍 Buscando franqueados no banco matriz...');
      
      // Mapear filtros para o schema do banco matriz
      const filtrosMatriz = mapearFiltrosFranqueado(filters as Record<string, unknown>);
      
      let query = supabaseMatriz
        .from('v_franqueados_unidades_detalhes')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filtrosMatriz.search && typeof filtrosMatriz.search === 'string') {
        query = query.or(`
          full_name.ilike.%${filtrosMatriz.search}%,
          contact.ilike.%${filtrosMatriz.search}%,
          cpf_rnm.ilike.%${filtrosMatriz.search}%
        `);
      }
      
      if (filtrosMatriz.owner_type && typeof filtrosMatriz.owner_type === 'string') {
        query = query.eq('owner_type', filtrosMatriz.owner_type);
      }
      
      if (typeof filtrosMatriz.is_in_contract === 'boolean') {
        query = query.eq('is_in_contract', filtrosMatriz.is_in_contract);
      }
      
      if (typeof filtrosMatriz.receives_prolabore === 'boolean') {
        query = query.eq('receives_prolabore', filtrosMatriz.receives_prolabore);
      }

      // Aplicar ordenação (mapear campo para o schema matriz)
      const campoOrdenacao = sort.field === 'nome' ? 'full_name' : sort.field;
      query = query.order(campoOrdenacao, { ascending: sort.direction === 'asc' });

      // Aplicar paginação
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar franqueados:', error);
        throw new Error(`Erro ao buscar franqueados: ${error.message}`);
      }

      // Mapear dados do banco matriz para formato do sistema
      const franqueadosMapeados = (data as VFranqueadosUnidadesDetalhes[]).map(mapearFranqueadoMatriz);

      console.log(`✅ ${franqueadosMapeados.length} franqueados encontrados`);

      return {
        data: franqueadosMapeados as unknown as Franqueado[],
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
   * Buscar franqueado específico por ID
   */
  async getFranqueadoById(id: string): Promise<Franqueado | null> {
    try {
      console.log(`🔍 Buscando franqueado ${id} no banco matriz...`);
      
      const { data, error } = await supabaseMatriz
        .from('v_franqueados_unidades_detalhes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Franqueado não encontrado');
          return null;
        }
        throw new Error(`Erro ao buscar franqueado: ${error.message}`);
      }

      const franqueadoMapeado = mapearFranqueadoMatriz(data as VFranqueadosUnidadesDetalhes);
      
      console.log('✅ Franqueado encontrado:', franqueadoMapeado.nome);
      return franqueadoMapeado as unknown as Franqueado;
    } catch (error) {
      console.error('❌ Erro no getFranqueadoById:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar franqueado');
    }
  }

  /**
   * Buscar franqueados por código de unidade
   */
  async getFranqueadosByUnidade(codigoUnidade: number): Promise<Franqueado[]> {
    try {
      console.log(`🔍 Buscando franqueados da unidade ${codigoUnidade}...`);
      
      const { data, error } = await supabaseMatriz
        .from('v_franqueados_unidades_detalhes')
        .select('*')
        .contains('unidade_group_codes', [codigoUnidade]);

      if (error) {
        throw new Error(`Erro ao buscar franqueados da unidade: ${error.message}`);
      }

      const franqueadosMapeados = (data as VFranqueadosUnidadesDetalhes[]).map(mapearFranqueadoMatriz);
      
      console.log(`✅ ${franqueadosMapeados.length} franqueados encontrados para a unidade`);
      return franqueadosMapeados as unknown as Franqueado[];
    } catch (error) {
      console.error('❌ Erro no getFranqueadosByUnidade:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar franqueados da unidade');
    }
  }

  // ================================
  // OPERAÇÕES RELACIONADAS (BANCO LOCAL)
  // ================================

  /**
   * Buscar cobranças do franqueado no banco local
   */
  async getCobrancasByFranqueado(franqueadoId: string): Promise<unknown[]> {
    try {
      console.log(`🔍 Buscando cobranças do franqueado ${franqueadoId}...`);
      
      // Primeiro buscar unidades do franqueado no banco matriz
      const franqueado = await this.getFranqueadoById(franqueadoId);
      const franqueadoMapeado = franqueado as unknown as import('../types/matriz').FranqueadoMapeado;
      
      if (!franqueadoMapeado?.unidades_ids || franqueadoMapeado.unidades_ids.length === 0) {
        console.log('❌ Franqueado não possui unidades vinculadas');
        return [];
      }

      // Buscar cobranças no banco local usando os IDs das unidades
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .in('unidade_id', franqueadoMapeado.unidades_ids);

      if (error) {
        throw new Error(`Erro ao buscar cobranças: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} cobranças encontradas`);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no getCobrancasByFranqueado:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar cobranças do franqueado');
    }
  }

  /**
   * Estatísticas do franqueado (usando dados do banco local)
   */
  async getEstatisticasFranqueado(franqueadoId: string): Promise<Record<string, unknown>> {
    try {
      console.log(`📊 Calculando estatísticas do franqueado ${franqueadoId}...`);
      
      const cobrancas = await this.getCobrancasByFranqueado(franqueadoId);
      
      type CobrancaBasica = { status?: string; valor?: number };
      const cobrancasTyped = cobrancas as CobrancaBasica[];
      
      const estatisticas = {
        total_cobrancas: cobrancasTyped.length,
        cobrancas_pendentes: cobrancasTyped.filter(c => c.status === 'pendente').length,
        cobrancas_pagas: cobrancasTyped.filter(c => c.status === 'pago').length,
        valor_total: cobrancasTyped.reduce((sum, c) => sum + (c.valor || 0), 0),
        valor_pendente: cobrancasTyped.filter(c => c.status === 'pendente').reduce((sum, c) => sum + (c.valor || 0), 0),
        valor_pago: cobrancasTyped.filter(c => c.status === 'pago').reduce((sum, c) => sum + (c.valor || 0), 0),
      };
      
      console.log('✅ Estatísticas calculadas:', estatisticas);
      return estatisticas;
    } catch (error) {
      console.error('❌ Erro no getEstatisticasFranqueado:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao calcular estatísticas');
    }
  }

  // ================================
  // MÉTODOS REMOVIDOS (NÃO FAZEMOS MAIS CRUD)
  // ================================
  
  // Os seguintes métodos foram REMOVIDOS pois agora só fazemos consulta:
  // - createFranqueado()
  // - updateFranqueado() 
  // - deleteFranqueado()
  // - vincularUnidade()
  // - desvincularUnidade()
  // 
  // Estes dados agora são gerenciados diretamente no banco matriz
}

export const franqueadosService = new FranqueadosService();