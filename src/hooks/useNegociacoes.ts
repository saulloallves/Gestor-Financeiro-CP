import { useQuery } from '@tanstack/react-query';
import { negociacoesService } from '../api/negociacoesService';

export const negociacoesKeys = {
  all: ['negociacoes'] as const,
  list: () => [...negociacoesKeys.all, 'list'] as const,
  details: (id: string) => [...negociacoesKeys.all, 'detail', id] as const,
};

export function useNegociacoes() {
  return useQuery({
    queryKey: negociacoesKeys.list(),
    queryFn: () => negociacoesService.getNegociacoes(),
  });
}

export function useNegociacaoDetalhes(negociacaoId: string | null) {
  return useQuery({
    queryKey: negociacoesKeys.details(negociacaoId!),
    queryFn: () => negociacoesService.getInteracoes(negociacaoId!),
    enabled: !!negociacaoId,
  });
}