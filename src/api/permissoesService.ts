import { supabase } from './supabaseClient';
import type { PerfilUsuario } from '../types/equipes';
import type { Permissao, PermissaoFormData } from '../types/permissoes';

export class PermissoesService {
  /**
   * Busca todas as permissões para um determinado perfil e/ou equipe.
   */
  static async getPermissionsForUser(
    perfil: PerfilUsuario,
    equipeId?: string | null
  ): Promise<string[]> {
    try {
      let query = supabase
        .from('perfis_permissoes')
        .select('recurso')
        .eq('permitido', true);

      const orConditions = [`perfil.eq.${perfil}`];
      if (equipeId) {
        orConditions.push(`equipe_id.eq.${equipeId}`);
      }
      
      query = query.or(orConditions.join(','));

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar permissões:', error);
        throw new Error('Não foi possível carregar as permissões do usuário.');
      }

      const permissions = data?.map(p => p.recurso) || [];
      return [...new Set(permissions)];

    } catch (error) {
      console.error('Erro fatal ao buscar permissões:', error);
      return [];
    }
  }

  /**
   * Busca todas as regras de permissão para a tela de gerenciamento.
   */
  static async getPermissoes(): Promise<Permissao[]> {
    const { data, error } = await supabase
      .from('perfis_permissoes')
      .select(`
        *,
        equipes (
          nome_equipe
        )
      `)
      .order('recurso', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar regras de permissão: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Cria uma nova regra de permissão.
   */
  static async createPermissao(dados: PermissaoFormData): Promise<Permissao> {
    const { data, error } = await supabase
      .from('perfis_permissoes')
      .insert(dados)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar permissão: ${error.message}`);
    }
    return data;
  }

  /**
   * Atualiza uma regra de permissão existente.
   */
  static async updatePermissao(id: number, dados: Partial<PermissaoFormData>): Promise<Permissao> {
    const { data, error } = await supabase
      .from('perfis_permissoes')
      .update(dados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar permissão: ${error.message}`);
    }
    return data;
  }

  /**
   * Exclui uma regra de permissão.
   */
  static async deletePermissao(id: number): Promise<void> {
    const { error } = await supabase
      .from('perfis_permissoes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir permissão: ${error.message}`);
    }
  }
}