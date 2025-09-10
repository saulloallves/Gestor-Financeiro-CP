// Hooks customizados para o módulo de Unidades
// Usando TanStack Query (React Query) para gerenciamento de estado do servidor

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { unidadesService } from "../api/unidadesService";
import { getStatusLabel } from "../utils/statusMask";
import type {
  Unidade,
  UnidadeFilter,
  UnidadeSort,
  UnidadePagination,
  StatusUnidade,
} from "../types/unidades";

// Query keys para organização e invalidação de cache
export const unidadesQueryKeys = {
  all: ["unidades"] as const,
  lists: () => [...unidadesQueryKeys.all, "list"] as const,
  list: (
    filters: UnidadeFilter,
    sort: UnidadeSort,
    pagination: UnidadePagination
  ) => [...unidadesQueryKeys.lists(), { filters, sort, pagination }] as const,
  details: () => [...unidadesQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...unidadesQueryKeys.details(), id] as const,
  estatisticas: () => [...unidadesQueryKeys.all, "estatisticas"] as const,
  geograficas: () => [...unidadesQueryKeys.all, "geograficas"] as const,
};

// ================================
// HOOKS DE CONSULTA (SOMENTE LEITURA)
// ================================

/**
 * Hook para buscar lista de unidades com filtros, ordenação e paginação
 */
export function useUnidades(
  filters: UnidadeFilter = {},
  sort: UnidadeSort = { field: "codigo_unidade", direction: "asc" },
  pagination: UnidadePagination = { page: 1, limit: 50 }
) {
  return useQuery({
    queryKey: unidadesQueryKeys.list(filters, sort, pagination),
    queryFn: () => unidadesService.getUnidades(filters, sort, pagination),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar estatísticas gerais de todas as unidades (sem paginação)
 */
export function useUnidadesEstatisticas() {
  return useQuery({
    queryKey: unidadesQueryKeys.estatisticas(),
    queryFn: () => unidadesService.getUnidades({}, { field: "codigo_unidade", direction: "asc" }, { page: 1, limit: 5000 }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    select: (data) => {
      const unidades = data.data || [];
      return {
        total: data.pagination.total || 0,
        ativas: unidades.filter(u => u.status === "OPERAÇÃO").length,
        em_implantacao: unidades.filter(u => u.status === "IMPLANTAÇÃO").length,
        canceladas: unidades.filter(u => u.status === "CANCELADO").length,
      };
    },
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

// ================================
// HOOKS UTILITÁRIOS
// ================================

/**
 * Hook para gerenciar filtros e estado da interface
 */
export function useUnidadesFilters() {
  const [filters, setFilters] = useState<UnidadeFilter>({});
  const [sort, setSort] = useState<UnidadeSort>({
    field: "codigo_unidade",
    direction: "asc",
  });
  const [pagination, setPagination] = useState<UnidadePagination>({
    page: 1,
    limit: 50,
  });

  const resetFilters = () => {
    setFilters({});
    setPagination({ page: 1, limit: 50 });
  };

  const updateFilter = (key: keyof UnidadeFilter, value: string | boolean | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const updateSort = (field: keyof Unidade) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return {
    filters,
    sort,
    pagination,
    setFilters,
    setSort,
    setPagination,
    resetFilters,
    updateFilter,
    updateSort,
  };
}

/**
 * Hook para trabalhar com labels de status
 */
export function useUnidadeStatus() {
  const getStatusLabelForUnidade = (status: StatusUnidade) => getStatusLabel(status);

  const statusOptions = [
    { value: "ativa", label: "Ativa" },
    { value: "inativa", label: "Inativa" },
    { value: "em_construcao", label: "Em Construção" },
    { value: "planejada", label: "Planejada" },
    { value: "vendida", label: "Vendida" },
  ];

  return {
    getStatusLabel: getStatusLabelForUnidade,
    statusOptions,
  };
}

/**
 * Hook para formatação de dados específicos de unidades
 */
export function useUnidadeFormHelpers() {
  // Formatar código de unidade
  const formatCodigoUnidade = (value: string) => {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  };

  // Formatar área (m²)
  const formatArea = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue) ? "0" : numValue.toFixed(2);
  };

  // Formatar valor de investimento
  const formatValorInvestimento = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", ".")) : value;
    return isNaN(numValue) ? 0 : numValue;
  };

  // Validar coordenadas geográficas
  const isValidLatitude = (lat: number) => lat >= -90 && lat <= 90;
  const isValidLongitude = (lng: number) => lng >= -180 && lng <= 180;

  return {
    formatCodigoUnidade,
    formatArea,
    formatValorInvestimento,
    isValidLatitude,
    isValidLongitude,
  };
}

// ================================
// HOOKS COMPOSTOS
// ================================

/**
 * Hook para gerenciar o estado completo de uma página de listagem
 */
export function useUnidadesPage(
  initialFilters: UnidadeFilter = {},
  initialSort: UnidadeSort = { field: "codigo_unidade", direction: "asc" },
  initialPagination: UnidadePagination = { page: 1, limit: 50 } // Aumentando para 50
) {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [pagination, setPagination] = useState(initialPagination);

  const unidadesQuery = useUnidades(filters, sort, pagination);

  const handleFilterChange = (newFilters: UnidadeFilter) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const handleSortChange = (newSort: UnidadeSort) => {
    setSort(newSort);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, limit: pageSize, page: 1 }));
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

    // Ações
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    refetch: unidadesQuery.refetch,
  };
}

/**
 * Hook para buscar unidades por região/área geográfica
 */
export function useUnidadesPorRegiao(
  uf?: string,
  cidade?: string,
  enabled: boolean = true
) {
  const filters: UnidadeFilter = {};
  if (uf) filters.uf = uf;
  if (cidade) filters.cidade = cidade;

  return useQuery({
    queryKey: [...unidadesQueryKeys.lists(), "regiao", uf, cidade],
    queryFn: () => unidadesService.getUnidades(filters, { field: "codigo_unidade", direction: "asc" }, { page: 1, limit: 1000 }),
    enabled: enabled,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}