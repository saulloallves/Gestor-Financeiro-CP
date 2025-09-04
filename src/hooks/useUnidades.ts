// Hooks customizados para o módulo de Unidades
// Usando TanStack Query (React Query) para gerenciamento de estado do servidor

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { unidadesService } from '../api/unidadesService';
import type {
  Unidade,
  CreateUnidadeData,
  UpdateUnidadeData,
  UnidadeFilter,
  UnidadeSort,
  UnidadePagination
} from '../types/unidades';

// Query keys para organização e invalidação de cache
export const unidadesQueryKeys = {
  all: ['unidades'] as const,
  lists: () => [...unidadesQueryKeys.all, 'list'] as const,
  list: (filters: UnidadeFilter, sort: UnidadeSort, pagination: UnidadePagination) => 
    [...unidadesQueryKeys.lists(), { filters, sort, pagination }] as const,
  details: () => [...unidadesQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...unidadesQueryKeys.details(), id] as const,
  franqueados: () => [...unidadesQueryKeys.all, 'franqueados'] as const,
  estatisticas: () => [...unidadesQueryKeys.all, 'estatisticas'] as const,
};

// ================================
// HOOKS DE CONSULTA
// ================================

/**
 * Hook para buscar lista de unidades com filtros, ordenação e paginação
 */
export function useUnidades(
  filters: UnidadeFilter = {},
  sort: UnidadeSort = { field: 'codigo_unidade', direction: 'asc' },
  pagination: UnidadePagination = { page: 1, limit: 50 }
) {
  return useQuery({
    queryKey: unidadesQueryKeys.list(filters, sort, pagination),
    queryFn: () => unidadesService.getUnidades(filters, sort, pagination),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (novo nome no TanStack Query v5)
  });
}

/**
 * Hook para buscar unidade por ID
 */
export function useUnidade(id: string) {
  return useQuery({
    queryKey: unidadesQueryKeys.detail(id),
    queryFn: () => unidadesService.getUnidadeById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para buscar franqueados disponíveis para seleção
 */
export function useFranqueados() {
  return useQuery({
    queryKey: unidadesQueryKeys.franqueados(),
    queryFn: () => unidadesService.getFranqueados(),
    staleTime: 10 * 60 * 1000, // 10 minutos (dados menos voláteis)
  });
}

/**
 * Hook para buscar estatísticas das unidades
 */
export function useEstatisticasUnidades() {
  return useQuery({
    queryKey: unidadesQueryKeys.estatisticas(),
    queryFn: () => unidadesService.getEstatisticas(),
    staleTime: 30 * 60 * 1000, // 30 minutos (dados estatísticos)
  });
}

// ================================
// HOOKS DE MUTAÇÃO
// ================================

/**
 * Hook para criar nova unidade
 */
export function useCreateUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnidadeData) => unidadesService.createUnidade(data),
    onSuccess: (newUnidade) => {
      // Invalidar cache da lista de unidades
      queryClient.invalidateQueries({ queryKey: unidadesQueryKeys.lists() });
      
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: unidadesQueryKeys.estatisticas() });
      
      // Adicionar a nova unidade ao cache de detalhes
      queryClient.setQueryData(
        unidadesQueryKeys.detail(newUnidade.id),
        newUnidade
      );

      toast.success(`Unidade ${newUnidade.codigo_unidade} criada com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao criar unidade:', error);
      toast.error(error.message || 'Erro ao criar unidade');
    },
  });
}

/**
 * Hook para atualizar unidade existente
 */
export function useUpdateUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUnidadeData) => unidadesService.updateUnidade(data),
    onSuccess: (updatedUnidade) => {
      // Invalidar cache da lista de unidades
      queryClient.invalidateQueries({ queryKey: unidadesQueryKeys.lists() });
      
      // Atualizar cache de detalhes
      queryClient.setQueryData(
        unidadesQueryKeys.detail(updatedUnidade.id),
        updatedUnidade
      );

      // Invalidar estatísticas (pode ter mudado status)
      queryClient.invalidateQueries({ queryKey: unidadesQueryKeys.estatisticas() });

      toast.success(`Unidade ${updatedUnidade.codigo_unidade} atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar unidade:', error);
      toast.error(error.message || 'Erro ao atualizar unidade');
    },
  });
}

/**
 * Hook para alterar status da unidade
 */
export function useUpdateStatusUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      unidadesService.updateStatus(id, status),
    onSuccess: (updatedUnidade) => {
      // Invalidar cache da lista de unidades
      queryClient.invalidateQueries({ queryKey: unidadesQueryKeys.lists() });
      
      // Atualizar cache de detalhes
      queryClient.setQueryData(
        unidadesQueryKeys.detail(updatedUnidade.id),
        updatedUnidade
      );

      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: unidadesQueryKeys.estatisticas() });

      toast.success(`Status da unidade ${updatedUnidade.codigo_unidade} alterado para ${updatedUnidade.status}`);
    },
    onError: (error: Error) => {
      console.error('Erro ao alterar status:', error);
      toast.error(error.message || 'Erro ao alterar status da unidade');
    },
  });
}

// ================================
// HOOKS UTILITÁRIOS
// ================================

/**
 * Hook para validação de CNPJ
 */
export function useValidateCnpj() {
  return useMutation({
    mutationFn: ({ cnpj, excludeId }: { cnpj: string; excludeId?: string }) => 
      unidadesService.isCnpjUnique(cnpj, excludeId),
    onError: (error: Error) => {
      console.error('Erro ao validar CNPJ:', error);
    },
  });
}

/**
 * Hook para gerar próximo código de unidade
 */
export function useGenerateNextCode() {
  return useMutation({
    mutationFn: () => unidadesService.generateNextCode(),
    onError: (error: Error) => {
      console.error('Erro ao gerar código:', error);
      toast.error('Erro ao gerar código da unidade');
    },
  });
}

/**
 * Hook para exportar unidades para CSV
 */
export function useExportUnidades() {
  return useMutation({
    mutationFn: (filters: UnidadeFilter = {}) => unidadesService.exportToCsv(filters),
    onSuccess: (csvData) => {
      // Criar e baixar arquivo CSV
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `unidades_${new Date().toISOString().split('T')[0]}.csv`);
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
export function useUnidadesPage(
  initialFilters: UnidadeFilter = {},
  initialSort: UnidadeSort = { field: 'codigo_unidade', direction: 'asc' },
  initialPagination: UnidadePagination = { page: 1, limit: 20 }
) {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [pagination, setPagination] = useState(initialPagination);

  const unidadesQuery = useUnidades(filters, sort, pagination);
  const updateStatusMutation = useUpdateStatusUnidade();
  const exportMutation = useExportUnidades();

  const handleFilterChange = (newFilters: UnidadeFilter) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const handleSortChange = (newSort: UnidadeSort) => {
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleStatusChange = (unidade: Unidade, newStatus: string) => {
    updateStatusMutation.mutate({ id: unidade.id, status: newStatus });
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
    unidades: unidadesQuery.data?.data || [],
    totalUnidades: unidadesQuery.data?.pagination.total || 0,
    totalPages: unidadesQuery.data?.pagination.totalPages || 0,
    
    // Status
    isLoading: unidadesQuery.isLoading,
    isError: unidadesQuery.isError,
    error: unidadesQuery.error,
    isExporting: exportMutation.isPending,
    
    // Ações
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handleStatusChange,
    handleExport,
    refetch: unidadesQuery.refetch,
  };
}
