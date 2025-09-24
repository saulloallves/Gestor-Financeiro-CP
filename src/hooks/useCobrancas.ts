import { useMutation } from '@tanstack/react-query';
import { cobrancasService } from '../api/cobrancasService';
import { useDataStore } from '../store/dataStore';
import toast from 'react-hot-toast';
import type { CriarCobrancaData, EditarCobrancaData, CobrancaFormData } from '../types/cobrancas';

// Hook para criar cobrança
export function useCriarCobranca() {
  const addCobranca = useDataStore((state) => state.addCobranca);

  return useMutation({
    mutationFn: (dados: CriarCobrancaData) => cobrancasService.criarCobranca(dados),
    onSuccess: (novaCobranca) => {
      toast.success('Cobrança criada com sucesso!');
      addCobranca(novaCobranca); // Atualiza o cache local
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cobrança: ${error.message}`);
    },
  });
}

// Hook para editar cobrança
export function useEditarCobranca() {
  const updateCobranca = useDataStore((state) => state.updateCobranca);

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EditarCobrancaData }) =>
      cobrancasService.editarCobranca(id, dados),
    onSuccess: (cobrancaAtualizada) => {
      toast.success('Cobrança atualizada com sucesso!');
      updateCobranca(cobrancaAtualizada); // Atualiza o cache local
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cobrança: ${error.message}`);
    },
  });
}

// Hook para criar cobrança integrada com ASAAS
export function useCriarCobrancaIntegrada() {
  const addCobranca = useDataStore((state) => state.addCobranca);

  return useMutation({
    mutationFn: (dados: CobrancaFormData) => cobrancasService.criarCobrancaIntegrada(dados),
    onSuccess: (novaCobranca) => {
      toast.success('Cobrança integrada criada com sucesso!');
      addCobranca(novaCobranca); // Atualiza o cache local
    },
    onError: (error: Error) => {
      toast.error(`Erro na integração: ${error.message}`);
    },
  });
}

// Hook para gerar boleto
export function useGerarBoleto() {
  const updateCobranca = useDataStore((state) => state.updateCobranca);
  return useMutation({
    mutationFn: (id: string) => cobrancasService.gerarBoletoAsaas(id),
    onSuccess: (data, id) => {
      toast.success('Boleto gerado! URL copiada para a área de transferência.');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.boleto_url);
      }
      const store = useDataStore.getState();
      const cobranca = store.getCobrancaById(id);
      if (cobranca) {
        updateCobranca({ ...cobranca, link_boleto: data.boleto_url, link_pagamento: data.link_pagamento });
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar boleto: ${error.message}`);
    },
  });
}

// Hook para sincronizar status
export function useSincronizarStatus() {
  const updateCobranca = useDataStore((state) => state.updateCobranca);
  return useMutation({
    mutationFn: (id: string) => cobrancasService.sincronizarStatusAsaas(id),
    onSuccess: (cobrancaAtualizada) => {
      toast.success('Status sincronizado com sucesso!');
      updateCobranca(cobrancaAtualizada);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao sincronizar status: ${error.message}`);
    },
  });
}