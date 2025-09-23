// Serviço de API para o módulo de Unidades
// REFATORADO PARA USAR BANCO MATRIZ (SOMENTE LEITURA)

import { supabaseMatriz } from "./supabaseMatrizClient";
import { supabase } from "./supabaseClient"; // Para operações no banco local
import type {
  Unidade,
  UnidadeFilter,
  UnidadeSort,
  UnidadePagination,
  UnidadeListResponse,
} from "../types/unidades";
import type {
  UnidadeMatriz,
} from "../types/matriz";
import { 
  mapearUnidadeMatriz, 
  mapearFiltrosUnidade 
} from "../utils/matrizMappers";

class UnidadesService {
  // ================================
  // CONSULTAS (BANCO MATRIZ - SOMENTE LEITURA)
  // ================================

  /**
   * Buscar todas as unidades do banco matriz
   */
  async getUnidades(
    filters: UnidadeFilter = {},
    sort: UnidadeSort = { field: "codigo_unidade", direction: "asc" },
    pagination: UnidadePagination = { page: 1, limit: 50 }
  ): Promise<UnidadeListResponse> {
    try {
      console.log('🔍 Buscando unidades no banco matriz...');
      
      // Mapear filtros para o schema do banco matriz
      const filtrosMatriz = mapearFiltrosUnidade(filters as Record<string, unknown>);
      
      let query = supabaseMatriz
        .from('unidades')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filtrosMatriz.search && typeof filtrosMatriz.search === 'string') {
        query = query.or(`
          group_name.ilike.%${filtrosMatriz.search}%,
          group_code.eq.${filtrosMatriz.search},
          city.ilike.%${filtrosMatriz.search}%,
          email.ilike.%${filtrosMatriz.search}%
        `);
      }
      
      if (filtrosMatriz.store_model && typeof filtrosMatriz.store_model === 'string') {
        query = query.eq('store_model', filtrosMatriz.store_model);
      }
      
      if (filtrosMatriz.store_phase && typeof filtrosMatriz.store_phase === 'string') {
        query = query.eq('store_phase', filtrosMatriz.store_phase);
      }
      
      if (filtrosMatriz.city && typeof filtrosMatriz.city === 'string') {
        query = query.ilike('city', `%${filtrosMatriz.city}%`);
      }
      
      if (filtrosMatriz.state && typeof filtrosMatriz.state === 'string') {
        query = query.ilike('state', `%${filtrosMatriz.state}%`);
      }
      
      if (filtrosMatriz.uf && typeof filtrosMatriz.uf === 'string') {
        query = query.eq('uf', filtrosMatriz.uf);
      }

      // Aplicar ordenação (mapear campo para o schema matriz)
      let campoOrdenacao: string = sort.field;
      switch (sort.field) {
        case 'codigo_unidade':
          campoOrdenacao = 'group_code';
          break;
        case 'nome_padrao':
          campoOrdenacao = 'group_name';
          break;
        case 'endereco_cidade':
          campoOrdenacao = 'city';
          break;
        case 'endereco_uf':
          campoOrdenacao = 'uf';
          break;
        default:
          campoOrdenacao = sort.field;
      }
      
      query = query.order(campoOrdenacao, { ascending: sort.direction === 'asc' });

      // Aplicar paginação
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar unidades:', error);
        throw new Error(`Erro ao buscar unidades: ${error.message}`);
      }

      // Mapear dados do banco matriz para formato do sistema
      const unidadesMapeadas = (data as UnidadeMatriz[]).map(mapearUnidadeMatriz);

      console.log(`✅ ${unidadesMapeadas.length} unidades encontradas`);

      return {
        data: unidadesMapeadas as unknown as Unidade[],
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
   * Buscar unidade específica por ID
   */
  async getUnidadeById(id: string): Promise<Unidade | null> {
    try {
      console.log(`🔍 Buscando unidade ${id} no banco matriz...`);
      
      const { data, error } = await supabaseMatriz
        .from('unidades')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Unidade não encontrada');
          return null;
        }
        throw new Error(`Erro ao buscar unidade: ${error.message}`);
      }

      const unidadeMapeada = mapearUnidadeMatriz(data as UnidadeMatriz);
      
      console.log('✅ Unidade encontrada:', unidadeMapeada.nome_padrao);
      return unidadeMapeada as unknown as Unidade;
    } catch (error) {
      console.error('❌ Erro no getUnidadeById:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar unidade');
    }
  }

  /**
   * Buscar unidade por código
   */
  async getUnidadeByCodigo(codigo: number): Promise<Unidade | null> {
    try {
      console.log(`🔍 Buscando unidade com código ${codigo} no banco matriz...`);
      
      const { data, error } = await supabaseMatriz
        .from('unidades')
        .select('*')
        .eq('group_code', codigo)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Unidade não encontrada');
          return null;
        }
        throw new Error(`Erro ao buscar unidade: ${error.message}`);
      }

      const unidadeMapeada = mapearUnidadeMatriz(data as UnidadeMatriz);
      
      console.log('✅ Unidade encontrada:', unidadeMapeada.nome_padrao);
      return unidadeMapeada as unknown as Unidade;
    } catch (error) {
      console.error('❌ Erro no getUnidadeByCodigo:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar unidade por código');
    }
  }

  /**
   * Buscar unidades por estado/UF
   */
  async getUnidadesByEstado(uf: string): Promise<Unidade[]> {
    try {
      console.log(`🔍 Buscando unidades do estado ${uf}...`);
      
      const { data, error } = await supabaseMatriz
        .from('unidades')
        .select('*')
        .eq('uf', uf.toUpperCase())
        .order('group_name');

      if (error) {
        throw new Error(`Erro ao buscar unidades do estado: ${error.message}`);
      }

      const unidadesMapeadas = (data as UnidadeMatriz[]).map(mapearUnidadeMatriz);
      
      console.log(`✅ ${unidadesMapeadas.length} unidades encontradas no estado ${uf}`);
      return unidadesMapeadas as unknown as Unidade[];
    } catch (error) {
      console.error('❌ Erro no getUnidadesByEstado:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar unidades por estado');
    }
  }

  /**
   * Buscar unidades por cidade
   */
  async getUnidadesByCidade(cidade: string): Promise<Unidade[]> {
    try {
      console.log(`🔍 Buscando unidades da cidade ${cidade}...`);
      
      const { data, error } = await supabaseMatriz
        .from('unidades')
        .select('*')
        .ilike('city', `%${cidade}%`)
        .order('group_name');

      if (error) {
        throw new Error(`Erro ao buscar unidades da cidade: ${error.message}`);
      }

      const unidadesMapeadas = (data as UnidadeMatriz[]).map(mapearUnidadeMatriz);
      
      console.log(`✅ ${unidadesMapeadas.length} unidades encontradas na cidade ${cidade}`);
      return unidadesMapeadas as unknown as Unidade[];
    } catch (error) {
      console.error('❌ Erro no getUnidadesByCidade:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar unidades por cidade');
    }
  }

  // ================================
  // OPERAÇÕES RELACIONADAS (BANCO LOCAL)
  // ================================

  /**
   * Buscar cobranças da unidade no banco local
   */
  async getCobrancasByUnidade(unidadeId: string): Promise<unknown[]> {
    try {
      console.log(`🔍 Buscando cobranças da unidade ${unidadeId}...`);
      
      // Buscar cobranças no banco local usando o ID da unidade
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('unidade_id', unidadeId);

      if (error) {
        throw new Error(`Erro ao buscar cobranças: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} cobranças encontradas`);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no getCobrancasByUnidade:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar cobranças da unidade');
    }
  }

  /**
   * Buscar franqueados da unidade (busca no banco matriz)
   */
  async getFranqueadosByUnidade(codigoUnidade: number): Promise<unknown[]> {
    try {
      console.log(`🔍 Buscando franqueados da unidade ${codigoUnidade}...`);
      
      const { data, error } = await supabaseMatriz
        .from('v_franqueados_unidades_detalhes')
        .select('*')
        .contains('unidade_group_codes', [codigoUnidade]);

      if (error) {
        throw new Error(`Erro ao buscar franqueados da unidade: ${error.message}`);
      }

      console.log(`✅ ${data?.length || 0} franqueados encontrados para a unidade`);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no getFranqueadosByUnidade:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar franqueados da unidade');
    }
  }

  /**
   * Estatísticas da unidade (usando dados do banco local)
   */
  async getEstatisticasUnidade(unidadeId: string): Promise<Record<string, unknown>> {
    try {
      console.log(`📊 Calculando estatísticas da unidade ${unidadeId}...`);
      
      const cobrancas = await this.getCobrancasByUnidade(unidadeId);
      
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
      console.error('❌ Erro no getEstatisticasUnidade:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao calcular estatísticas');
    }
  }

  /**
   * Buscar lista de estados disponíveis
   */
  async getEstadosDisponiveis(): Promise<{ uf: string; estado: string; total: number }[]> {
    try {
      console.log('🔍 Buscando estados disponíveis...');
      
      const { data, error } = await supabaseMatriz
        .from('unidades')
        .select('uf, state')
        .not('uf', 'is', null)
        .not('state', 'is', null);

      if (error) {
        throw new Error(`Erro ao buscar estados: ${error.message}`);
      }

      // Agrupar por estado e contar
      const estadosMap = new Map<string, { estado: string; count: number }>();
      
      (data as { uf: string; state: string }[]).forEach(item => {
        const uf = item.uf.toUpperCase();
        const estado = item.state;
        
        if (estadosMap.has(uf)) {
          estadosMap.get(uf)!.count++;
        } else {
          estadosMap.set(uf, { estado, count: 1 });
        }
      });

      const estados = Array.from(estadosMap.entries()).map(([uf, info]) => ({
        uf,
        estado: info.estado,
        total: info.count
      })).sort((a, b) => a.estado.localeCompare(b.estado));

      console.log(`✅ ${estados.length} estados encontrados`);
      return estados;
    } catch (error) {
      console.error('❌ Erro no getEstadosDisponiveis:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar estados');
    }
  }

  // ================================
  // MÉTODOS REMOVIDOS (NÃO FAZEMOS MAIS CRUD)
  // ================================
  
  // Os seguintes métodos foram REMOVIDOS pois agora só fazemos consulta:
  // - createUnidade()
  // - updateUnidade() 
  // - deleteUnidade()
  // - updateStatus()
  // - updateFranqueadoPrincipal()
  // 
  // Estes dados agora são gerenciados diretamente no banco matriz
}

export const unidadesService = new UnidadesService();