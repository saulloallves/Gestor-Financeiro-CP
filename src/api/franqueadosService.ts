/* eslint-disable @typescript-eslint/no-explicit-any */

// Serviço de API para o módulo de Franqueados
// Integração com Supabase seguindo as diretrizes do projeto

import { supabase } from './supabaseClient';
import type {
  Franqueado,
  CreateFranqueadoData,
  UpdateFranqueadoData,
  FranqueadoFilter,
  FranqueadoSort,
  FranqueadoPagination,
  FranqueadoListResponse,
  UnidadeParaVinculo,
  FranqueadoRelatório
} from '../types/franqueados';

class FranqueadosService {
  // ================================
  // LISTAGEM E BUSCA
  // ================================

  /**
   * Buscar todos os franqueados com filtros, ordenação e paginação
   */
  async getFranqueados(
    filters: FranqueadoFilter = {},
    sort: FranqueadoSort = { field: 'nome', direction: 'asc' },
    pagination: FranqueadoPagination = { page: 1, limit: 50 }
  ): Promise<FranqueadoListResponse> {
    try {
      let query = supabase
        .from('franqueados')
        .select(`
          *,
          unidades_vinculadas:franqueados_unidades(
            id,
            data_vinculo,
            ativo,
            unidade:unidades(
              id,
              codigo_unidade,
              nome_padrao,
              status
            )
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.tipo && filters.tipo.length > 0) {
        query = query.in('tipo', filters.tipo);
      }

      if (filters.cidade) {
        query = query.ilike('endereco_cidade', `%${filters.cidade}%`);
      }

      if (filters.estado) {
        query = query.eq('endereco_estado', filters.estado);
      }

      if (filters.nome) {
        query = query.ilike('nome', `%${filters.nome}%`);
      }

      if (filters.cpf) {
        query = query.ilike('cpf', `%${filters.cpf}%`);
      }

      if (filters.contrato_social !== undefined) {
        query = query.eq('contrato_social', filters.contrato_social);
      }

      if (filters.empreendedor_previo !== undefined) {
        query = query.eq('empreendedor_previo', filters.empreendedor_previo);
      }

      // Aplicar ordenação
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Aplicar paginação
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Erro ao buscar franqueados: ${error.message}`);
      }

      // Processar dados para o formato esperado
      const processedData = (data || []).map((franqueado: any) => ({
        ...franqueado,
        unidades_vinculadas: franqueado.unidades_vinculadas?.map((vinculo: any) => ({
          id: vinculo.unidade.id,
          codigo_unidade: vinculo.unidade.codigo_unidade,
          nome_padrao: vinculo.unidade.nome_padrao,
          status: vinculo.unidade.status,
          data_vinculo: vinculo.data_vinculo,
          ativo: vinculo.ativo,
          franqueado_principal: false // TODO: implementar lógica
        })) || []
      }));

      return {
        data: processedData as Franqueado[],
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pagination.limit),
        },
      };
    } catch (error) {
      console.error('Erro no FranqueadosService.getFranqueados:', error);
      throw error;
    }
  }

  /**
   * Buscar franqueado por ID
   */
  async getFranqueadoById(id: string): Promise<Franqueado | null> {
    try {
      const { data, error } = await supabase
        .from('franqueados')
        .select(`
          *,
          unidades_vinculadas:franqueados_unidades(
            id,
            data_vinculo,
            ativo,
            unidade:unidades(
              id,
              codigo_unidade,
              nome_padrao,
              status
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw new Error(`Erro ao buscar franqueado: ${error.message}`);
      }

      // Processar dados
      const processedData = {
        ...data,
        unidades_vinculadas: data.unidades_vinculadas?.map((vinculo: any) => ({
          id: vinculo.unidade.id,
          codigo_unidade: vinculo.unidade.codigo_unidade,
          nome_padrao: vinculo.unidade.nome_padrao,
          status: vinculo.unidade.status,
          data_vinculo: vinculo.data_vinculo,
          ativo: vinculo.ativo,
          franqueado_principal: false // TODO: implementar lógica
        })) || []
      };

      return processedData as Franqueado;
    } catch (error) {
      console.error('Erro no FranqueadosService.getFranqueadoById:', error);
      throw error;
    }
  }

  /**
   * Buscar franqueado por CPF
   */
  async getFranqueadoByCpf(cpf: string): Promise<Franqueado | null> {
    try {
      const { data, error } = await supabase
        .from('franqueados')
        .select(`
          *,
          unidades_vinculadas:franqueados_unidades(
            id,
            data_vinculo,
            ativo,
            unidade:unidades(
              id,
              codigo_unidade,
              nome_padrao,
              status
            )
          )
        `)
        .eq('cpf', cpf)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        throw new Error(`Erro ao buscar franqueado por CPF: ${error.message}`);
      }

      // Processar dados
      const processedData = {
        ...data,
        unidades_vinculadas: data.unidades_vinculadas?.map((vinculo: any) => ({
          id: vinculo.unidade.id,
          codigo_unidade: vinculo.unidade.codigo_unidade,
          nome_padrao: vinculo.unidade.nome_padrao,
          status: vinculo.unidade.status,
          data_vinculo: vinculo.data_vinculo,
          ativo: vinculo.ativo,
          franqueado_principal: false // TODO: implementar lógica
        })) || []
      };

      return processedData as Franqueado;
    } catch (error) {
      console.error('Erro no FranqueadosService.getFranqueadoByCpf:', error);
      throw error;
    }
  }

  // ================================
  // CRIAÇÃO E EDIÇÃO
  // ================================

  /**
   * Criar novo franqueado
   */
  async createFranqueado(franqueadoData: CreateFranqueadoData): Promise<Franqueado> {
    try {
      const { unidades_vinculadas, ...dadosFranqueado } = franqueadoData;

      const { data, error } = await supabase
        .from('franqueados')
        .insert({
          ...dadosFranqueado,
          status: franqueadoData.status || 'ativo',
          contrato_social: franqueadoData.contrato_social || false,
          empreendedor_previo: franqueadoData.empreendedor_previo || false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar franqueado: ${error.message}`);
      }

      // Se há unidades para vincular, criar os vínculos
      if (unidades_vinculadas && unidades_vinculadas.length > 0) {
        await this.vincularUnidades(data.id, unidades_vinculadas);
      }

      return data as Franqueado;
    } catch (error) {
      console.error('Erro no FranqueadosService.createFranqueado:', error);
      throw error;
    }
  }

  /**
   * Atualizar franqueado existente
   */
  async updateFranqueado(franqueadoData: UpdateFranqueadoData): Promise<Franqueado> {
    try {
      const { id, unidades_vinculadas, ...updateData } = franqueadoData;

      const { data, error } = await supabase
        .from('franqueados')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar franqueado: ${error.message}`);
      }

      // Se há mudanças nos vínculos, atualizar
      if (unidades_vinculadas !== undefined) {
        await this.atualizarVinculosUnidades(id, unidades_vinculadas);
      }

      return data as Franqueado;
    } catch (error) {
      console.error('Erro no FranqueadosService.updateFranqueado:', error);
      throw error;
    }
  }

  /**
   * Alterar status do franqueado
   */
  async updateStatus(id: string, status: string): Promise<Franqueado> {
    try {
      const { data, error } = await supabase
        .from('franqueados')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao alterar status: ${error.message}`);
      }

      return data as Franqueado;
    } catch (error) {
      console.error('Erro no FranqueadosService.updateStatus:', error);
      throw error;
    }
  }

  // ================================
  // VALIDAÇÕES
  // ================================

  /**
   * Verificar se CPF já existe
   */
  async isCpfUnique(cpf: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('franqueados')
        .select('id')
        .eq('cpf', cpf);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Erro ao verificar CPF: ${error.message}`);
      }

      return (data?.length || 0) === 0;
    } catch (error) {
      console.error('Erro no FranqueadosService.isCpfUnique:', error);
      throw error;
    }
  }

  // ================================
  // VÍNCULOS COM UNIDADES
  // ================================

  /**
   * Buscar unidades disponíveis para vínculo
   */
  async getUnidadesParaVinculo(): Promise<UnidadeParaVinculo[]> {
    try {
      const { data, error } = await supabase
        .from('unidades')
        .select(`
          id,
          codigo_unidade,
          nome_padrao,
          status,
          franqueado_principal_id,
          franqueado_principal:franqueados(nome)
        `)
        .eq('status', 'ativo')
        .order('codigo_unidade');

      if (error) {
        throw new Error(`Erro ao buscar unidades: ${error.message}`);
      }

      return (data || []).map((unidade: any) => ({
        id: unidade.id,
        codigo_unidade: unidade.codigo_unidade,
        nome_padrao: unidade.nome_padrao,
        status: unidade.status,
        franqueado_principal_id: unidade.franqueado_principal_id,
        franqueado_principal_nome: unidade.franqueado_principal?.nome
      }));
    } catch (error) {
      console.error('Erro no FranqueadosService.getUnidadesParaVinculo:', error);
      throw error;
    }
  }

  /**
   * Vincular franqueado a unidades
   */
  async vincularUnidades(franqueadoId: string, unidadeIds: string[]): Promise<void> {
    try {
      const vinculos = unidadeIds.map(unidadeId => ({
        franqueado_id: franqueadoId,
        unidade_id: unidadeId,
        ativo: true
      }));

      const { error } = await supabase
        .from('franqueados_unidades')
        .insert(vinculos);

      if (error) {
        throw new Error(`Erro ao vincular unidades: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no FranqueadosService.vincularUnidades:', error);
      throw error;
    }
  }

  /**
   * Atualizar vínculos de unidades
   */
  async atualizarVinculosUnidades(franqueadoId: string, unidadeIds: string[]): Promise<void> {
    try {
      // Primeiro, desativar todos os vínculos existentes
      await supabase
        .from('franqueados_unidades')
        .update({ ativo: false })
        .eq('franqueado_id', franqueadoId);

      // Depois, criar/reativar os vínculos necessários
      if (unidadeIds.length > 0) {
        const vinculos = unidadeIds.map(unidadeId => ({
          franqueado_id: franqueadoId,
          unidade_id: unidadeId,
          ativo: true
        }));

        const { error } = await supabase
          .from('franqueados_unidades')
          .upsert(vinculos, { 
            onConflict: 'franqueado_id,unidade_id',
            ignoreDuplicates: false 
          });

        if (error) {
          throw new Error(`Erro ao atualizar vínculos: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Erro no FranqueadosService.atualizarVinculosUnidades:', error);
      throw error;
    }
  }

  // ================================
  // UTILITÁRIOS
  // ================================

  /**
   * Exportar franqueados para CSV
   */
  async exportToCsv(filters: FranqueadoFilter = {}): Promise<string> {
    try {
      // Buscar todos os franqueados com os filtros aplicados
      const response = await this.getFranqueados(
        filters, 
        { field: 'nome', direction: 'asc' }, 
        { page: 1, limit: 10000 }
      );
      
      const headers = [
        'Nome',
        'CPF',
        'Tipo',
        'Status',
        'Telefone',
        'WhatsApp',
        'Email Pessoal',
        'Email Comercial',
        'Cidade',
        'Estado',
        'Pró-labore',
        'Contrato Social',
        'Disponibilidade',
        'Unidades Vinculadas'
      ];

      const csvRows = [
        headers.join(','),
        ...response.data.map(franqueado => [
          `"${franqueado.nome}"`,
          franqueado.cpf || '',
          franqueado.tipo,
          franqueado.status,
          franqueado.telefone || '',
          franqueado.whatsapp || '',
          franqueado.email_pessoal || '',
          franqueado.email_comercial || '',
          franqueado.endereco_cidade || '',
          franqueado.endereco_estado || '',
          franqueado.prolabore ? `R$ ${franqueado.prolabore.toFixed(2)}` : '',
          franqueado.contrato_social ? 'Sim' : 'Não',
          franqueado.disponibilidade,
          `"${franqueado.unidades_vinculadas?.map(u => u.codigo_unidade).join(', ') || ''}"`
        ].join(','))
      ];

      return csvRows.join('\n');
    } catch (error) {
      console.error('Erro no FranqueadosService.exportToCsv:', error);
      throw error;
    }
  }

  /**
   * Buscar estatísticas dos franqueados
   */
  async getEstatisticas(): Promise<FranqueadoRelatório> {
    try {
      const [totalResult, tipoResult, statusResult, estadosResult, prolaboreResult, empreendedorResult] = await Promise.all([
        supabase.from('franqueados').select('id', { count: 'exact', head: true }),
        supabase.from('franqueados').select('tipo', { count: 'exact' }),
        supabase.from('franqueados').select('status', { count: 'exact' }),
        supabase.from('franqueados').select('endereco_estado', { count: 'exact' }),
        supabase.from('franqueados').select('prolabore', { count: 'exact' }).not('prolabore', 'is', null),
        supabase.from('franqueados').select('empreendedor_previo', { count: 'exact' }).eq('empreendedor_previo', true)
      ]);

      if (totalResult.error || tipoResult.error || statusResult.error || estadosResult.error) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const tipoCounts = tipoResult.data?.reduce((acc: any, item: any) => {
        acc[item.tipo] = (acc[item.tipo] || 0) + 1;
        return acc;
      }, {}) || {};

      const statusCounts = statusResult.data?.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const estadosCounts = estadosResult.data?.reduce((acc: any, item: any) => {
        if (item.endereco_estado) {
          acc[item.endereco_estado] = (acc[item.endereco_estado] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      return {
        total_franqueados: totalResult.count || 0,
        por_tipo: {
          principal: tipoCounts.principal || 0,
          familiar: tipoCounts.familiar || 0,
          investidor: tipoCounts.investidor || 0,
          parceiro: tipoCounts.parceiro || 0
        },
        por_status: {
          ativo: statusCounts.ativo || 0,
          inativo: statusCounts.inativo || 0
        },
        por_estado: Object.entries(estadosCounts).map(([estado, count]) => ({
          estado,
          count: count as number
        })),
        com_prolabore: prolaboreResult.count || 0,
        empreendedores_previos: empreendedorResult.count || 0,
        multifranqueados: 0 // TODO: implementar query para multifranqueados
      };
    } catch (error) {
      console.error('Erro no FranqueadosService.getEstatisticas:', error);
      throw error;
    }
  }
}

export const franqueadosService = new FranqueadosService();