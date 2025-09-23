import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiProvidersService, type ModelInfo } from '../api/aiProvidersService';
import type { IAProvider } from '../types/ia';

export const useAIModels = () => {
  const [provider, setProvider] = useState<IAProvider | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Query para buscar modelos
  const {
    data: models = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai-models', provider, apiKey],
    queryFn: () => {
      if (!provider || !apiKey) {
        return Promise.resolve([]);
      }
      return aiProvidersService.fetchModels(provider, apiKey);
    },
    enabled: Boolean(provider && apiKey && apiKey.length > 10),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos de cache
    retry: 1, // Tentar apenas uma vez para não esgotar limite de API
    refetchOnWindowFocus: false, // Não recarregar quando a janela ganhar foco
    refetchOnMount: true, // Sempre recarregar quando o componente montar
  });

  // Função para buscar modelos manualmente
  const fetchModels = useCallback(async (newProvider: IAProvider, newApiKey: string): Promise<ModelInfo[]> => {
    setProvider(newProvider);
    setApiKey(newApiKey);
    
    try {
      const result = await aiProvidersService.fetchModels(newProvider, newApiKey);
      return result;
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      throw error;
    }
  }, []);

  // Função para testar conexão
  const testConnection = useCallback(async (testProvider: IAProvider, testApiKey: string): Promise<boolean> => {
    try {
      return await aiProvidersService.testConnection(testProvider, testApiKey);
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  }, []);

  // Limpar dados
  const clearModels = useCallback(() => {
    setProvider(null);
    setApiKey('');
  }, []);

  return {
    models,
    isLoading,
    error,
    fetchModels,
    testConnection,
    clearModels,
    refetch,
  };
};