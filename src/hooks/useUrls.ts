import { useMutation, useQueryClient } from '@tanstack/react-query';
import { urlsService, type AtualizarUrlsData } from '../api/urlsService';

export function useAtualizarUrls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AtualizarUrlsData) => urlsService.atualizarUrls(data),
    onSuccess: () => {
      // Invalida queries relacionadas às cobranças
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
    },
  });
}

export function useProcessarCobrancasSemUrls() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => urlsService.processarCobrancasSemUrls(),
    onSuccess: () => {
      // Invalida queries relacionadas às cobranças
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
    },
  });
}