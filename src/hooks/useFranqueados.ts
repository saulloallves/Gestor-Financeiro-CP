import { useQuery } from '@tanstack/react-query';
import { franqueadosService } from '../api/franqueadosService';
import type { FranqueadoFilter, FranqueadoSort, FranqueadoPagination } from '../types/franqueados';

export const franqueadosKeys = {
  all: ['franqueados'] as const,
  lists: () => [...franqueadosKeys.all, 'list'] as const,
  list: (params: unknown) => [...franqueadosKeys.lists(), params] as const,
  stats: () => [...franqueadosKeys.all, 'stats'] as const,
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

export function useFranqueadosEstatisticas() {
  return useQuery({
    queryKey: franqueadosKeys.stats(),
    queryFn: () => franqueadosService.getEstatisticas(),
  });
}