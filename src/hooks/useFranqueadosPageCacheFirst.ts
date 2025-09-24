import { useState, useMemo } from "react";
import { useDataStore } from "../store/dataStore";
import type {
  Franqueado,
  FranqueadoFilter,
  FranqueadoSort,
} from "../types/franqueados";

export function useFranqueadosPageCacheFirst(
  initialFilters: FranqueadoFilter = {},
  initialSort: FranqueadoSort = { field: "nome", direction: "asc" }
) {
  const { franqueados, sync } = useDataStore();
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState(initialSort);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });

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

    return franqueadosFiltrados;
  }, [franqueados, filters, sort]);

  const paginatedData = useMemo(() => {
    const startIndex = paginationModel.page * paginationModel.pageSize;
    const endIndex = startIndex + paginationModel.pageSize;
    return dadosProcessados.slice(startIndex, endIndex);
  }, [dadosProcessados, paginationModel]);

  const handleFilterChange = (newFilters: FranqueadoFilter) => {
    setFilters(newFilters);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleSortChange = (newSort: FranqueadoSort) => {
    setSort(newSort);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handlePaginationModelChange = (newModel: { page: number; pageSize: number }) => {
    setPaginationModel(newModel);
  };

  return {
    filters,
    sort,
    pagination: paginationModel,
    franqueados: paginatedData,
    totalFranqueados: dadosProcessados.length,
    isLoading: sync.isLoading,
    isError: !!sync.error,
    error: sync.error,
    hasInitialLoad: sync.hasInitialLoad,
    handleFilterChange,
    handleSortChange,
    handlePaginationModelChange,
    refetch: useDataStore.getState().refreshData,
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