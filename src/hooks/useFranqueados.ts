import { useQuery } from '@tanstack/react-query';
import { franqueadosService } from '../api/franqueadosService';
import type { FranqueadoFilter, FranqueadoSort, FranqueadoPagination } from '../types/franqueados';

// NOTA: Este hook busca dados diretamente da API.
// Para páginas de listagem, prefira o hook `useFranqueadosCacheFirst` que utiliza o cache local.
// Este hook pode ser útil para buscas específicas ou componentes que não devem depender do cache global.

export const franqueadosKeys = {
  all: ['franqueados'] as const,
  lists: () => [...franqueadosKeys.all, 'list'] as const,
  list: (params: unknown) => [...franqueadosKeys.lists(), params] as const,
};

export function useFranqueados(
  filters?: FranqueadoFilter,
  sort?: FranqueadoSort,
  pagination?: FranqueadoPagination
) {
  return useQuery({
    queryKey: franqueadosKeys.list({ filters, sort, pagination }),
    queryFn: () => franqueadosService.getFranqueados(filters, sort, pagination),
  });
}