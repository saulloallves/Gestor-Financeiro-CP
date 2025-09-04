/* eslint-disable @typescript-eslint/no-explicit-any */

// Serviço de API para o módulo de Unidades
// Integração com Supabase seguindo as diretrizes do projeto

import { supabase } from './supabaseClient';
import type {
  Unidade,
  CreateUnidadeData,
  UpdateUnidadeData,
  UnidadeFilter,
  UnidadeSort,
  UnidadePagination,
  UnidadeListResponse,
  FranqueadoPrincipal,
  FranqueadoVinculado
} from '../types/unidades';

class UnidadesService {
  // ================================
  // LISTAGEM E BUSCA
  // ================================

  /**
   * Buscar todas as unidades com filtros, ordenação e paginação
   */
  async getUnidades(
    filters: UnidadeFilter = {},
    sort: UnidadeSort = { field: 'codigo_unidade', direction: 'asc' },
    pagination: UnidadePagination = { page: 1, limit: 50 }
  ): Promise<UnidadeListResponse> {
    try {
      let query = supabase
        .from('unidades')
        .select('*, franqueado_principal:franqueados(id, nome, email)', { count: 'exact' });

      // Aplicar filtros
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.cidade) {
        query = query.ilike('endereco_cidade', `%${filters.cidade}%`);
      }

      if (filters.uf) {
        query = query.eq('endereco_uf', filters.uf);
      }

      if (filters.codigo_unidade) {
        query = query.ilike('codigo_unidade', `%${filters.codigo_unidade}%`);
      }

      if (filters.nome_padrao) {
        query = query.ilike('nome_padrao', `%${filters.nome_padrao}%`);
      }

      if (filters.multifranqueado !== undefined) {
        query = query.eq('multifranqueado', filters.multifranqueado);
      }

      if (filters.franqueado_principal_id) {
        query = query.eq('franqueado_principal_id', filters.franqueado_principal_id);
      }

      // Aplicar ordenação
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Aplicar paginação
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar unidades: ${error.message}`);
      }

      return {
        data: (data || []) as Unidade[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pagination.limit),
        },
      };
    } catch (error) {
      console.error('Erro no UnidadesService.getUnidades:', error);
      throw error;
    }
  }

  /**
   * Buscar unidade por ID
   */
  async getUnidadeById(id: string): Promise<Unidade | null> {
    try {
      const { data, error } = await supabase
        .from('unidades')
        .select('*, franqueado_principal:franqueados(id, nome, email, telefone, cpf)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw new Error(`Erro ao buscar unidade: ${error.message}`);
      }

      return data as Unidade;
    } catch (error) {
      console.error('Erro no UnidadesService.getUnidadeById:', error);
      throw error;
    }
  }

  /**
   * Buscar unidade por código
   */
  async getUnidadeByCodigo(codigo: string): Promise<Unidade | null> {
    try {
      const { data, error } = await supabase
        .from('unidades')
        .select('*, franqueado_principal:franqueados(id, nome, email)')
        .eq('codigo_unidade', codigo)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw new Error(`Erro ao buscar unidade por código: ${error.message}`);
      }

      return data as Unidade;
    } catch (error) {
      console.error('Erro no UnidadesService.getUnidadeByCodigo:', error);
      throw error;
    }
  }

  // ================================
  // CRIAÇÃO E EDIÇÃO
  // ================================

  /**
   * Gerar próximo código de unidade
   */
  async generateNextCode(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_next_unit_code');

      if (error) {
        throw new Error(`Erro ao gerar código: ${error.message}`);
      }

      return data as string;
    } catch (error) {
      console.error('Erro no UnidadesService.generateNextCode:', error);
      throw error;
    }
  }

  /**
   * Criar nova unidade
   */
  async createUnidade(unidadeData: CreateUnidadeData): Promise<Unidade> {
    try {
      // Usar código fornecido ou gerar automaticamente com a função RPC do Supabase
      const codigo = unidadeData.codigo_unidade || await this.generateNextCode();

      const { data, error } = await supabase
        .from('unidades')
        .insert({
          ...unidadeData,
          codigo_unidade: codigo,
          status: unidadeData.status || 'ativo',
          multifranqueado: unidadeData.multifranqueado || false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar unidade: ${error.message}`);
      }

      return data as Unidade;
    } catch (error) {
      console.error('Erro no UnidadesService.createUnidade:', error);
      throw error;
    }
  }

  /**
   * Atualizar unidade existente
   */
  async updateUnidade(unidadeData: UpdateUnidadeData): Promise<Unidade> {
    try {
      const { id, ...updateData } = unidadeData;

      const { data, error } = await supabase
        .from('unidades')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar unidade: ${error.message}`);
      }

      return data as Unidade;
    } catch (error) {
      console.error('Erro no UnidadesService.updateUnidade:', error);
      throw error;
    }
  }

  /**
   * Alterar status da unidade
   */
  async updateStatus(id: string, status: string): Promise<Unidade> {
    try {
      const { data, error } = await supabase
        .from('unidades')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }

      return data as Unidade;
    } catch (error) {
      console.error('Erro no UnidadesService.updateStatus:', error);
      throw error;
    }
  }

  // ================================
  // VALIDAÇÕES
  // ================================

  /**
   * Verificar se CNPJ já existe
   */
  async isCnpjUnique(cnpj: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('unidades')
        .select('id')
        .eq('cnpj', cnpj);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao verificar CNPJ: ${error.message}`);
      }

      return (data?.length || 0) === 0;
    } catch (error) {
      console.error('Erro no UnidadesService.isCnpjUnique:', error);
      throw error;
    }
  }

  /**
   * Verificar se código da unidade já existe
   */
  async isCodigoUnique(codigo: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('unidades')
        .select('id')
        .eq('codigo_unidade', codigo);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao verificar código: ${error.message}`);
      }

      return (data?.length || 0) === 0;
    } catch (error) {
      console.error('Erro no UnidadesService.isCodigoUnique:', error);
      throw error;
    }
  }

  // ================================
  // FRANQUEADOS
  // ================================

  /**
   * Buscar franqueados para seleção
   */
  async getFranqueados(): Promise<FranqueadoPrincipal[]> {
    try {
      const { data, error } = await supabase
        .from('franqueados')
        .select('id, nome, email, telefone, cpf, tipo')
        .order('nome');

      if (error) {
        throw new Error(`Erro ao buscar franqueados: ${error.message}`);
      }

      return (data || []) as FranqueadoPrincipal[];
    } catch (error) {
      console.error('Erro no UnidadesService.getFranqueados:', error);
      throw error;
    }
  }

  /**
   * Buscar franqueados vinculados a uma unidade específica
   */
  async getFranqueadosVinculados(unidadeId: string): Promise<FranqueadoVinculado[]> {
    try {
      const { data, error } = await supabase
        .from('franqueados_unidades')
        .select(`
          id,
          franqueado_id,
          unidade_id,
          data_vinculo,
          ativo,
          franqueado:franqueados(
            id,
            nome,
            cpf,
            telefone,
            email,
            tipo,
            status
          )
        `)
        .eq('unidade_id', unidadeId)
        .eq('ativo', true)
        .order('data_vinculo', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar franqueados vinculados: ${error.message}`);
      }

      return (data || []).map((vinculo: any) => ({
        id: vinculo.id,
        franqueado_id: vinculo.franqueado_id,
        unidade_id: vinculo.unidade_id,
        data_vinculo: vinculo.data_vinculo,
        ativo: vinculo.ativo,
        franqueado: {
          id: vinculo.franqueado.id,
          nome: vinculo.franqueado.nome,
          cpf: vinculo.franqueado.cpf,
          telefone: vinculo.franqueado.telefone,
          email: vinculo.franqueado.email,
          tipo: vinculo.franqueado.tipo,
          status: vinculo.franqueado.status
        }
      }));
    } catch (error) {
      console.error('Erro no UnidadesService.getFranqueadosVinculados:', error);
      throw error;
    }
  }

  // ================================
  // UTILITÁRIOS
  // ================================

  /**
   * Exportar unidades para CSV
   */
  async exportToCsv(filters: UnidadeFilter = {}): Promise<string> {
    try {
      // Buscar todas as unidades com os filtros aplicados
      const response = await this.getUnidades(filters, { field: 'codigo_unidade', direction: 'asc' }, { page: 1, limit: 10000 });
      
      const headers = [
        'Código',
        'Nome da Unidade',
        'CNPJ',
        'Status',
        'Telefone',
        'Email',
        'Cidade',
        'UF',
        'Franqueado Principal'
      ];

      const csvRows = [
        headers.join(','),
        ...response.data.map(unidade => [
          unidade.codigo_unidade,
          `"${unidade.nome_padrao}"`,
          unidade.cnpj || '',
          unidade.status,
          unidade.telefone_comercial || '',
          unidade.email_comercial || '',
          unidade.endereco_cidade || '',
          unidade.endereco_uf || '',
          `"${(unidade as any).franqueado_principal?.nome || ''}"`
        ].join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      console.error('Erro no UnidadesService.exportToCsv:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas das unidades
   */
  async getEstatisticas(): Promise<{
    total: number;
    ativas: number;
    inativas: number;
    em_implantacao: number;
    por_estado: { uf: string; count: number }[];
  }> {
    try {
      const [totalResult, statusResult, estadosResult] = await Promise.all([
        supabase.from('unidades').select('id', { count: 'exact', head: true }),
        supabase.from('unidades').select('status', { count: 'exact' }),
        supabase.from('unidades').select('endereco_uf', { count: 'exact' })
      ]);

      if (totalResult.error || statusResult.error || estadosResult.error) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const statusCounts = statusResult.data?.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const estadosCounts = estadosResult.data?.reduce((acc: any, item: any) => {
        if (item.endereco_uf) {
          acc[item.endereco_uf] = (acc[item.endereco_uf] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      return {
        total: totalResult.count || 0,
        ativas: statusCounts.ativo || 0,
        inativas: statusCounts.inativo || 0,
        em_implantacao: statusCounts.em_implantacao || 0,
        por_estado: Object.entries(estadosCounts).map(([uf, count]) => ({
          uf,
          count: count as number
        }))
      };
    } catch (error) {
      console.error('Erro no UnidadesService.getEstatisticas:', error);
      throw error;
    }
  }
}

export const unidadesService = new UnidadesService();
