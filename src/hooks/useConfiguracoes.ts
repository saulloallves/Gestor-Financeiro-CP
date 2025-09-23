import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracoesService } from '../api/configuracoesService';
import type { AtualizarConfiguracaoData } from '../types/configuracoes';

export const useConfiguracoes = () => {
  const queryClient = useQueryClient();

  const configuracaoQuery = useQuery({
    queryKey: ['configuracao-cobranca'],
    queryFn: () => configuracoesService.obterConfiguracao(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const atualizarMutation = useMutation({
    mutationFn: (dados: AtualizarConfiguracaoData) => 
      configuracoesService.atualizarConfiguracao(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-cobranca'] });
    },
  });

  const testarConfigMutation = useMutation({
    mutationFn: ({ valor, dias }: { valor?: number; dias?: number }) =>
      configuracoesService.testarConfiguracao(valor, dias),
  });

  return {
    configuracao: configuracaoQuery.data,
    isLoading: configuracaoQuery.isLoading,
    error: configuracaoQuery.error,
    refetch: configuracaoQuery.refetch,
    
    atualizar: atualizarMutation.mutate,
    isUpdating: atualizarMutation.isPending,
    updateError: atualizarMutation.error,
    
    testarConfiguracao: testarConfigMutation.mutate,
    resultadoTeste: testarConfigMutation.data,
    isTesting: testarConfigMutation.isPending,
    testError: testarConfigMutation.error,
  };
};
