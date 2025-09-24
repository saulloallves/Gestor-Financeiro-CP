import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iaService } from '../api/iaService';
import type { CriarBaseConhecimento } from '../types/ia';

export const useBaseConhecimento = (incluirInativos = false) => {
  const queryClient = useQueryClient();

  const conhecimentosQuery = useQuery({
    queryKey: ['baseConhecimento', incluirInativos],
    queryFn: () => iaService.getConhecimentos(incluirInativos),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const criarMutation = useMutation({
    mutationFn: (novoConhecimento: CriarBaseConhecimento) => iaService.createConhecimento(novoConhecimento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseConhecimento'] });
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<CriarBaseConhecimento> }) => 
      iaService.updateConhecimento(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseConhecimento'] });
    },
  });

  const inativarMutation = useMutation({
    mutationFn: (id: string) => iaService.inativarConhecimento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseConhecimento'] });
    },
  });

  const ativarMutation = useMutation({
    mutationFn: (id: string) => iaService.ativarConhecimento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseConhecimento'] });
    },
  });

  return {
    conhecimentos: conhecimentosQuery.data,
    isLoading: conhecimentosQuery.isLoading,
    error: conhecimentosQuery.error,
    refetch: conhecimentosQuery.refetch,
    
    criarConhecimento: criarMutation.mutate,
    isCreating: criarMutation.isPending,
    
    atualizarConhecimento: atualizarMutation.mutate,
    isUpdating: atualizarMutation.isPending,
    
    inativarConhecimento: inativarMutation.mutate,
    isDeleting: inativarMutation.isPending, // Mantendo o nome para compatibilidade
    
    ativarConhecimento: ativarMutation.mutate,
    isActivating: ativarMutation.isPending,
  };
};

// Hook para buscar versões de um conhecimento
export const useVersoesConhecimento = (conhecimentoId: string | null) => {
  return useQuery({
    queryKey: ['versoesConhecimento', conhecimentoId],
    queryFn: () => iaService.getVersoes(conhecimentoId!),
    enabled: !!conhecimentoId,
  });
};

// Hook para buscar logs de consulta de um conhecimento
export const useLogsConsulta = (conhecimentoId: string | null) => {
  return useQuery({
    queryKey: ['logsConsultaIA', conhecimentoId],
    queryFn: () => iaService.getLogs(conhecimentoId!),
    enabled: !!conhecimentoId,
  });
};