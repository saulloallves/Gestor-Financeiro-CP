import { useAuthStore } from '../store/authStore';
import type { UsuarioInterno } from '../types/auth';

/**
 * Hook para verificar as permissões do usuário logado.
 *
 * @returns Um objeto com a função `can` para verificar permissões e o perfil do usuário.
 */
export function usePermissions() {
  const { usuario } = useAuthStore();

  // Type guard para verificar se é um usuário interno
  const isUsuarioInterno = (user: any): user is UsuarioInterno => {
    return user && 'perfil' in user;
  };

  /**
   * Verifica se o usuário atual tem permissão para uma determinada ação em um recurso.
   *
   * @param action - A ação a ser executada (ex: 'view', 'create', 'edit', 'delete').
   * @param resource - O recurso a ser acessado (ex: 'sidebar:cobrancas', 'botao:excluir_usuario').
   * @returns `true` se o usuário tiver permissão, `false` caso contrário.
   */
  const can = (action: string, resource: string): boolean => {
    if (!usuario || !isUsuarioInterno(usuario)) {
      // Apenas usuários internos têm permissões granulares por enquanto
      return false;
    }

    // Regra de Bypass: Administradores ('admin') têm acesso a tudo.
    if (usuario.perfil === 'admin') {
      return true;
    }

    // Construir a string de permissão no formato "recurso:acao"
    const permissionString = `${resource}:${action}`;

    // Verificar se a permissão existe na lista de permissões do usuário
    return usuario.permissoes?.includes(permissionString) || false;
  };

  return { can, perfil: isUsuarioInterno(usuario) ? usuario.perfil : null };
}