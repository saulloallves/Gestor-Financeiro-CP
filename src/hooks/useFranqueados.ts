// Hooks customizados para o módulo de Franqueados
// Usando TanStack Query (React Query) para gerenciamento de estado do servidor

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { franqueadosService } from '../api/franqueadosService';
import { getTipoFranqueadoLabel, getStatusFranqueadoLabel } from '../utils/franqueadosMask';
import type {
  Franqueado,
  CreateFranqueadoData,
  UpdateFranqueadoData,
  FranqueadoFilter,
  FranqueadoSort,
  FranqueadoPagination
} from '../types/franqueados';

// Query keys para organização e invalidação de cache
export const franqueadosQueryKeys = {
  all: ['franqueados'] as const,
  lists: () => [...franqueadosQueryKeys.all, 'list'] as const,
  list: (filters: FranqueadoFilter, sort: FranqueadoSort, pagination: FranqueadoPagination) => 
    [...franqueadosQueryKeys.lists(), { filters, sort, pagination }] as const,
  details: () => [...franqueadosQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...franqueadosQueryKeys.details(), id] as const,
  unidades: () => [...franqueadosQueryKeys.all, 'unidades'] as const,
  estatisticas: () => [...franqueadosQueryKeys.all, 'estatisticas'] as const,
};

// ================================
// HOOKS DE CONSULTA
// ================================

/**
 * Hook para buscar lista de franqueados com filtros, ordenação e paginação
 */
export function useFranqueados(
  filters: FranqueadoFilter = {},
  sort: FranqueadoSort = { field: 'nome', direction: 'asc' },
  pagination: FranqueadoPagination = { page: 1, limit: 50 }
) {
  return useQuery({
    queryKey: franqueadosQueryKeys.list(filters, sort, pagination),
    queryFn: () => franqueadosService.getFranqueados(filters, sort, pagination),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar franqueado por ID
 */
export function useFranqueado(id: string) {
  return useQuery({
    queryKey: franqueadosQueryKeys.detail(id),
    queryFn: () => franqueadosService.getFranqueadoById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar unidades disponíveis para vínculo
 */
export function useUnidadesParaVinculo() {
  return useQuery({
    queryKey: franqueadosQueryKeys.unidades(),
    queryFn: () => franqueadosService.getUnidadesParaVinculo(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar estatísticas dos franqueados
 */
export function useEstatisticasFranqueados() {
  return useQuery({
    queryKey: franqueadosQueryKeys.estatisticas(),
    queryFn: () => franqueadosService.getEstatisticas(),
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// ================================
// HOOKS DE MUTAÇÃO
// ================================

/**
 * Hook para criar novo franqueado
 */
export function useCreateFranqueado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFranqueadoData) => franqueadosService.createFranqueado(data),
    onSuccess: (newFranqueado) => {
      // Invalidar cache da lista de franqueados
      queryClient.invalidateQueries({ queryKey: franqueadosQueryKeys.lists() });
      
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: franqueadosQueryKeys.estatisticas() });
      
      // Adicionar o novo franqueado ao cache de detalhes
      queryClient.setQueryData(
        franqueadosQueryKeys.detail(newFranqueado.id),
        newFranqueado
      );

      toast.success(`Franqueado ${newFranqueado.nome} cadastrado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar franqueado:', error);
      toast.error(error.message || 'Erro ao cadastrar franqueado');
    },
  });
}

/**
 * Hook para atualizar franqueado existente
 */
export function useUpdateFranqueado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFranqueadoData) => franqueadosService.updateFranqueado(data),
    onSuccess: (updatedFranqueado) => {
      // Invalidar cache da lista de franqueados
      queryClient.invalidateQueries({ queryKey: franqueadosQueryKeys.lists() });
      
      // Atualizar cache de detalhes
      queryClient.setQueryData(
        franqueadosQueryKeys.detail(updatedFranqueado.id),
        updatedFranqueado
      );

      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: franqueadosQueryKeys.estatisticas() });

      toast.success(`Franqueado ${updatedFranqueado.nome} atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar franqueado:', error);
      toast.error(error.message || 'Erro ao atualizar franqueado');
    },
  });
}

/**
 * Hook para alterar status do franqueado
 */
export function useUpdateStatusFranqueado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      franqueadosService.updateStatus(id, status),
    onSuccess: (updatedFranqueado) => {
      // Invalidar cache da lista de franqueados
      queryClient.invalidateQueries({ queryKey: franqueadosQueryKeys.lists() });
      
      // Atualizar cache de detalhes
      queryClient.setQueryData(
        franqueadosQueryKeys.detail(updatedFranqueado.id),
        updatedFranqueado
      );

      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: franqueadosQueryKeys.estatisticas() });

      toast.success(`Status do franqueado ${updatedFranqueado.nome} alterado para ${getStatusFranqueadoLabel(updatedFranqueado.status)}`);
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status:', error);
      toast.error(error.message || 'Erro ao alterar status do franqueado');
    },
  });
}

// ================================
// HOOKS UTILITÁRIOS
// ================================

/**
 * Hook para validação de CPF
 */
export function useValidateCpf() {
  return useMutation({
    mutationFn: ({ cpf, excludeId }: { cpf: string; excludeId?: string }) => 
      franqueadosService.isCpfUnique(cpf, excludeId),
    onError: (error: Error) => {
      console.error('Erro ao validar CPF:', error);
    },
  });
}

/**
 * Hook para exportar franqueados para CSV
 */
export function useExportFranqueados() {
  return useMutation({
    mutationFn: (filters: FranqueadoFilter = {}) => franqueadosService.exportToCsv(filters),
    onSuccess: (csvData) => {
      // Criar e baixar arquivo CSV
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `franqueados_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success('Relatório exportado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    },
  });
}

// ================================
// HOOKS COMPOSTOS
// ================================

/**
 * Hook para gerenciar o estado completo de uma página de listagem
 */
export function useFranqueadosPage(
  initialFilters: FranqueadoFilter = {},
  initialSort: FranqueadoSort = { field: 'nome', direction: 'asc' },
  initialPagination: FranqueadoPagination = { page: 1, limit: 20 }
) {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [pagination, setPagination] = useState(initialPagination);

  const franqueadosQuery = useFranqueados(filters, sort, pagination);
  const updateStatusMutation = useUpdateStatusFranqueado();
  const exportMutation = useExportFranqueados();

  const handleFilterChange = (newFilters: FranqueadoFilter) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const handleSortChange = (newSort: FranqueadoSort) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleStatusChange = (franqueado: Franqueado, newStatus: string) => {
    updateStatusMutation.mutate({ id: franqueado.id, status: newStatus });
  };

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  return {
    // Estado
    filters,
    sort,
    pagination,
    
    // Dados
    franqueados: franqueadosQuery.data?.data || [],
    totalFranqueados: franqueadosQuery.data?.pagination.total || 0,
    totalPages: franqueadosQuery.data?.pagination.totalPages || 0,
    
    // Status
    isLoading: franqueadosQuery.isLoading,
    isError: franqueadosQuery.isError,
    error: franqueadosQuery.error,
    isExporting: exportMutation.isPending,
    
    // Ações
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handleStatusChange,
    handleExport,
    refetch: franqueadosQuery.refetch,
  };
}