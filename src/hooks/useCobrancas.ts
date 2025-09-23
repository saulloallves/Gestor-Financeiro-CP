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