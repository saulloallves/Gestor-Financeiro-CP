import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iaService } from '../api/iaService';
import type { CriarBaseConhecimento } from '../types/ia';

export const useBaseConhecimento = () => {
  const queryClient = useQueryClient();

  const conhecimentosQuery = useQuery({
    queryKey: ['baseConhecimento'],
    queryFn: () => iaService.getConhecimentos(),
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

  const deletarMutation = useMutation({
    mutationFn: (id: string) => iaService.deleteConhecimento(id),
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
    createError: criarMutation.error,
    
    atualizarConhecimento: atualizarMutation.mutate,
    isUpdating: atualizarMutation.isPending,
    updateError: atualizarMutation.error,
    
    deletarConhecimento: deletarMutation.mutate,
    isDeleting: deletarMutation.isPending,
    deleteError: deletarMutation.error,
  };
};
