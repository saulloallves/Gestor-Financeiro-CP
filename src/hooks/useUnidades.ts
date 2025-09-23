import { useQuery } from '@tanstack/react-query';
import { unidadesService } from '../api/unidadesService';
import type { UnidadeFilter, UnidadeSort, UnidadePagination } from '../types/unidades';

// NOTA: Este hook busca dados diretamente da API.
// Para páginas de listagem, prefira o hook `useUnidadesCacheFirst` que utiliza o cache local.
// Este hook pode ser útil para buscas específicas ou componentes que não devem depender do cache global.

export const unidadesKeys = {
  all: ['unidades'] as const,
  lists: () => [...unidadesKeys.all, 'list'] as const,
  list: (params: unknown) => [...unidadesKeys.lists(), params] as const,
};

export function useUnidades(
  filters?: UnidadeFilter,
  sort?: UnidadeSort,
  pagination?: UnidadePagination
) {
  return useQuery({
    queryKey: unidadesKeys.list({ filters, sort, pagination }),
    queryFn: () => unidadesService.getUnidades(filters, sort, pagination),
  });
}