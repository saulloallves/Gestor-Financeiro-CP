import { supabase } from './supabaseClient';
import type { PerfilUsuario } from '../types/equipes';

export class PermissionsService {
  /**
   * Busca todas as permissões para um determinado perfil e/ou equipe.
   * @param perfil - O perfil do usuário (ex: 'admin', 'gestor').
   * @param equipeId - O ID da equipe do usuário (opcional).
   * @returns Uma lista de strings identificando os recursos permitidos.
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

      // Constrói a condição OR para buscar permissões do perfil E da equipe
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

      // Mapeia para um array de strings e remove duplicatas
      const permissions = data?.map(p => p.recurso) || [];
      return [...new Set(permissions)];

    } catch (error) {
      console.error('Erro fatal ao buscar permissões:', error);
      // Retorna um array vazio em caso de erro para não quebrar a aplicação
      return [];
    }
  }
}