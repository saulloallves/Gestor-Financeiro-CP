import { useQuery } from '@tanstack/react-query';
import { unidadesService } from '../api/unidadesService';
import type { UnidadeFilter, UnidadeSort, UnidadePagination } from '../types/unidades';

export const unidadesKeys = {
  all: ['unidades'] as const,
  lists: () => [...unidadesKeys.all, 'list'] as const,
  list: (params: unknown) => [...unidadesKeys.lists(), params] as const,
  stats: () => [...unidadesKeys.all, 'stats'] as const,
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

export function useUnidadesEstatisticas() {
  return useQuery({
    queryKey: unidadesKeys.stats(),
    queryFn: () => unidadesService.getEstatisticas(),
  });
}