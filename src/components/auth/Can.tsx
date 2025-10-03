import type { ReactNode } from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface CanProps {
  /** A ação que se deseja executar (ex: 'view', 'create', 'edit') */
  I: string;
  /** O recurso que está sendo protegido (ex: 'sidebar:cobrancas') */
  on: string;
  /** O conteúdo a ser renderizado se a permissão for concedida */
  children: ReactNode;
}

/**
 * Componente de Controle de Acesso (RBAC).
 * Renderiza o conteúdo filho (`children`) apenas se o usuário logado
 * tiver a permissão necessária para a ação (`I`) no recurso (`on`).
 *
 * Administradores (`admin`) sempre têm permissão.
 *
 * @example
 * <Can I="view" on="sidebar:cobrancas">
 *   <MenuItem>Cobranças</MenuItem>
 * </Can>
 */
export function Can({ I, on, children }: CanProps) {
  const { can } = usePermissions();

  if (can(I, on)) {
    return <>{children}</>;
  }

  return null;
}