import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cobrancasService } from '../api/cobrancasService';
import type { 
  Cobranca, 
  CriarCobrancaData, 
  EditarCobrancaData, 
  CobrancasFilters,
  NegociacaoCobranca,
  CobrancaFormData 
} from '../types/cobrancas';
import toast from 'react-hot-toast';
import { useDataStore } from '../store/dataStore';

export function useCobrancas(filters?: CobrancasFilters) {
  return useQuery({
    queryKey: ['cobrancas', filters],
    queryFn: () => cobrancasService.listarCobrancas(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCobranca(id: string) {
  return useQuery({
    queryKey: ['cobranca', id],
    queryFn: () => cobrancasService.obterCobranca(id),
    enabled: !!id,
  });
}

export function useEstatisticasCobrancas() {
  return useQuery({
    queryKey: ['estatisticas-cobrancas'],
    queryFn: () => cobrancasService.obterEstatisticas(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCriarCobranca() {
  const queryClient = useQueryClient();
  const addCobrancaToCache = useDataStore((state) => state.addCobranca);

  return useMutation({
    mutationFn: (dados: CriarCobrancaData) => cobrancasService.criarCobranca(dados),
    onSuccess: (novaCobranca) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      addCobrancaToCache(novaCobranca); // Adiciona ao cache local
      toast.success('Cobrança criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar cobrança');
    },
  });
}

export function useCriarCobrancaIntegrada() {
  const queryClient = useQueryClient();
  const addCobrancaToCache = useDataStore((state) => state.addCobranca);

  return useMutation({
    mutationFn: (dados: CobrancaFormData) => cobrancasService.criarCobrancaIntegrada(dados),
    onSuccess: (novaCobranca) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      addCobrancaToCache(novaCobranca); // Adiciona ao cache local
      toast.success('Cobrança integrada criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar cobrança integrada');
    },
  });
}

export function useEditarCobranca() {
  const queryClient = useQueryClient();
  const updateCobrancaInCache = useDataStore((state) => state.updateCobranca);

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EditarCobrancaData }) => 
      cobrancasService.editarCobranca(id, dados),
    onSuccess: (cobrancaAtualizada) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['cobranca', cobrancaAtualizada.id] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      updateCobrancaInCache(cobrancaAtualizada); // Atualiza no cache local
      toast.success('Cobrança atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar cobrança');
    },
  });
}

export function useExcluirCobranca() {
  const queryClient = useQueryClient();
  const removeCobrancaFromCache = useDataStore((state) => state.removeCobranca);

  return useMutation({
    mutationFn: (id: string) => cobrancasService.excluirCobranca(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      removeCobrancaFromCache(id); // Remove do cache local
      toast.success('Cobrança excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir cobrança');
    },
  });
}

export function useAtualizarStatusCobranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Cobranca['status'] }) =>
      cobrancasService.atualizarStatusCobranca(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['cobranca', id] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      toast.success('Status da cobrança atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
}

export function useAtualizarValoresCobrancas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cobrancasService.atualizarValores(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      toast.success('Valores atualizados com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar valores');
    },
  });
}

export function useGerarBoletoAsaas() {
  return useMutation({
    mutationFn: (id: string) => cobrancasService.gerarBoletoAsaas(id),
    onSuccess: () => {
      toast.success('Boleto gerado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao gerar boleto');
    },
  });
}

export function useSincronizarStatusAsaas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cobrancasService.sincronizarStatusAsaas(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['cobranca', id] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      toast.success('Status sincronizado com ASAAS!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao sincronizar status');
    },
  });
}

export function useCriarNegociacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: Omit<NegociacaoCobranca, 'id' | 'data_criacao'>) =>
      cobrancasService.criarNegociacao(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      toast.success('Negociação criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar negociação');
    },
  });
}

export function useNegociacoes(cobrancaId: string) {
  return useQuery({
    queryKey: ['negociacoes', cobrancaId],
    queryFn: () => cobrancasService.obterNegociacoes(cobrancaId),
    enabled: !!cobrancaId,
  });
}

export function useAtualizarStatusNegociacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: NegociacaoCobranca['status'] }) =>
      cobrancasService.atualizarStatusNegociacao(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['negociacoes'] });
      toast.success('Status da negociação atualizado!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status da negociação');
    },
  });
}