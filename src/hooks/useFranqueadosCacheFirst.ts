import { useState, useMemo } from "react";
import { useDataStore } from "../store/dataStore";
import type {
  Franqueado,
  FranqueadoFilter,
  FranqueadoSort,
  FranqueadoPagination,
} from "../types/franqueados";

export function useFranqueadosCacheFirst(
  filters: FranqueadoFilter = {},
  sort: FranqueadoSort = { field: "nome", direction: "asc" },
  pagination: FranqueadoPagination = { page: 1, limit: 20 }
) {
  const { franqueados, sync } = useDataStore();

  const dadosProcessados = useMemo(() => {
    let franqueadosFiltrados = [...franqueados];

    // Filtrar por nome/busca geral
    if (filters.nome && filters.nome.trim()) {
      const searchTerm = filters.nome.toLowerCase().trim();
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) =>
          f.nome?.toLowerCase().includes(searchTerm) ||
          f.cpf?.toLowerCase().includes(searchTerm) ||
          f.email?.toLowerCase().includes(searchTerm) ||
          f.telefone?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrar por CPF específico
    if (filters.cpf && filters.cpf.trim()) {
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) => f.cpf?.includes(filters.cpf!)
      );
    }

    // Filtrar por status
    if (filters.status && filters.status.length > 0) {
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) => filters.status!.includes(f.status)
      );
    }

    // Filtrar por tipo
    if (filters.tipo && filters.tipo.length > 0) {
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) => filters.tipo!.includes(f.tipo)
      );
    }

    // Filtrar por cidade
    if (filters.cidade && filters.cidade.trim()) {
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) => f.endereco_cidade?.toLowerCase().includes(filters.cidade!.toLowerCase())
      );
    }

    // Filtrar por estado
    if (filters.estado && filters.estado.trim()) {
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) => f.endereco_uf?.toLowerCase() === filters.estado!.toLowerCase()
      );
    }

    // Filtrar por contrato social
    if (filters.contrato_social !== undefined) {
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) => f.contrato_social === filters.contrato_social
      );
    }

    // Filtrar por empreendedor prévio
    if (filters.empreendedor_previo !== undefined) {
      franqueadosFiltrados = franqueadosFiltrados.filter(
        (f) => f.empreendedor_previo === filters.empreendedor_previo
      );
    }

    // Ordenação
    franqueadosFiltrados.sort((a, b) => {
      const field = sort.field as keyof Franqueado;
      const aValue = a[field] || "";
      const bValue = b[field] || "";
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;
      
      return sort.direction === "desc" ? -comparison : comparison;
    });

    // Paginação
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedData = franqueadosFiltrados.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: franqueadosFiltrados.length,
      totalPages: Math.ceil(franqueadosFiltrados.length / pagination.limit),
    };
  }, [franqueados, filters, sort, pagination]);

  return {
    data: dadosProcessados.data,
    total: dadosProcessados.total,
    totalPages: dadosProcessados.totalPages,
    isLoading: sync.isLoading,
    hasInitialLoad: sync.hasInitialLoad,
    error: sync.error,
  };
}

export function useFranqueadosEstatisticasCacheFirst() {
  const { franqueados, sync } = useDataStore();

  const estatisticas = useMemo(() => {
    return {
      total: franqueados.length,
      ativos: franqueados.filter((f) => f.status === "ativo").length,
      inativos: franqueados.filter((f) => f.status === "inativo").length,
      principais: franqueados.filter((f) => f.tipo === "principal").length,
    };
  }, [franqueados]);

  return {
    data: estatisticas,
    isLoading: sync.isLoading,
    hasInitialLoad: sync.hasInitialLoad,
    error: sync.error,
  };
}

export function useFranqueadosPageCacheFirst(
  initialFilters: FranqueadoFilter = {},
  initialSort: FranqueadoSort = { field: "nome", direction: "asc" },
  initialPagination: FranqueadoPagination = { page: 1, limit: 20 }
) {
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [pagination, setPagination] = useState(initialPagination);

  const franqueadosQuery = useFranqueadosCacheFirst(filters, sort, pagination);

  const handleFilterChange = (newFilters: FranqueadoFilter) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (newSort: FranqueadoSort) => {
    setSort(newSort);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination((prev) => ({ ...prev, limit: pageSize, page: 1 }));
  };

  const refreshData = () => {
    const { refreshData: refreshStore } = useDataStore.getState();
    return refreshStore(true);
  };

  return {
    filters,
    sort,
    pagination,
    franqueados: franqueadosQuery.data,
    totalFranqueados: franqueadosQuery.total,
    totalPages: franqueadosQuery.totalPages,
    isLoading: franqueadosQuery.isLoading,
    isError: !!franqueadosQuery.error,
    error: franqueadosQuery.error,
    hasInitialLoad: franqueadosQuery.hasInitialLoad,
    handleFilterChange,
    handleSortChange,
    handlePageChange,
    handlePageSizeChange,
    refetch: refreshData,
  };
}