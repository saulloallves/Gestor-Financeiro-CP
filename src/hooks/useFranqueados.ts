// Hooks customizados para o módulo de Franqueados
// Usando TanStack Query (React Query) para gerenciamento de estado do servidor

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { franqueadosService } from "../api/franqueadosService";
import { getStatusFranqueadoLabel } from "../utils/franqueadosMask";
import type {
  Franqueado,
  FranqueadoFilter,
  FranqueadoSort,
  FranqueadoPagination,
  StatusFranqueado,
} from "../types/franqueados";

// Query keys para organização e invalidação de cache
export const franqueadosQueryKeys = {
  all: ["franqueados"] as const,
  lists: () => [...franqueadosQueryKeys.all, "list"] as const,
  list: (
    filters: FranqueadoFilter,
    sort: FranqueadoSort,
    pagination: FranqueadoPagination
  ) =>
    [...franqueadosQueryKeys.lists(), { filters, sort, pagination }] as const,
  details: () => [...franqueadosQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...franqueadosQueryKeys.details(), id] as const,
  estatisticas: () => [...franqueadosQueryKeys.all, "estatisticas"] as const,
};

// ================================
// HOOKS DE CONSULTA (SOMENTE LEITURA)
// ================================

/**
 * Hook para buscar lista de franqueados com filtros, ordenação e paginação
 */
export function useFranqueados(
  filters: FranqueadoFilter = {},
  sort: FranqueadoSort = { field: "nome", direction: "asc" },
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
 * Hook para buscar estatísticas gerais de todos os franqueados (sem paginação)
 */
export function useFranqueadosEstatisticas() {
  return useQuery({
    queryKey: franqueadosQueryKeys.estatisticas(),
    queryFn: () => franqueadosService.getFranqueados({}, { field: "nome", direction: "asc" }, { page: 1, limit: 5000 }),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    select: (data) => {
      const franqueados = data.data || [];
      return {
        total: data.pagination.total || 0,
        ativos: franqueados.filter(f => f.status === "ativo").length,
        inativos: franqueados.filter(f => f.status === "inativo").length,
        principais: franqueados.filter(f => f.tipo === "principal").length,
      };
    },
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

// ================================
// HOOKS UTILITÁRIOS
// ================================

/**
 * Hook para gerenciar filtros e estado da interface
 */
export function useFranqueadosFilters() {
  const [filters, setFilters] = useState<FranqueadoFilter>({});
  const [sort, setSort] = useState<FranqueadoSort>({
    field: "nome",
    direction: "asc",
  });
  const [pagination, setPagination] = useState<FranqueadoPagination>({
    page: 1,
    limit: 50,
  });

  const resetFilters = () => {
    setFilters({});
    setPagination({ page: 1, limit: 50 });
  };

  const updateFilter = (key: keyof FranqueadoFilter, value: string | boolean | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const updateSort = (field: keyof Franqueado) => {
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
export function useFranqueadoStatus() {
  const getStatusLabel = (status: StatusFranqueado) => getStatusFranqueadoLabel(status);

  const statusOptions = [
    { value: "ativo", label: "Ativo" },
    { value: "inativo", label: "Inativo" },
    { value: "suspenso", label: "Suspenso" },
    { value: "pendente", label: "Pendente" },
  ];

  return {
    getStatusLabel,
    statusOptions,
  };
}

/**
 * Hook para formatação de dados de formulário
 */
export function useFranqueadoFormHelpers() {
  // Máscara para CNPJ
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  // Máscara para telefone
  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})$/, "$1-$2")
      .slice(0, 15);
  };

  // Máscara para CEP
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  };

  // Validar email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar CNPJ (algoritmo simplificado)
  const isValidCNPJ = (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, "");
    return cleanCNPJ.length === 14;
  };

  return {
    formatCNPJ,
    formatTelefone,
    formatCEP,
    isValidEmail,
    isValidCNPJ,
  };
}

// ================================
// HOOKS COMPOSTOS
// ================================

/**
 * Hook para gerenciar o estado completo de uma página de listagem
 */
export function useFranqueadosPage(
  initialFilters: FranqueadoFilter = {},
  initialSort: FranqueadoSort = { field: "nome", direction: "asc" },
  initialPagination: FranqueadoPagination = { page: 1, limit: 20 } // Ajustando para 20 igual às Unidades
) {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [pagination, setPagination] = useState(initialPagination);

  const franqueadosQuery = useFranqueados(filters, sort, pagination);

  const handleFilterChange = (newFilters: FranqueadoFilter) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset para primeira página
  };

  const handleSortChange = (newSort: FranqueadoSort) => {
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
    franqueados: franqueadosQuery.data?.data || [],
    totalFranqueados: franqueadosQuery.data?.pagination.total || 0,
    totalPages: franqueadosQuery.data?.pagination.totalPages || 0,

    // Status
    isLoading: franqueadosQuery.isLoading,
    isError: franqueadosQuery.isError,
    error: franqueadosQuery.error,

    // Ações
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    refetch: franqueadosQuery.refetch,
  };
}