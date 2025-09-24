import { useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import type { Cobranca, CobrancasFilters, StatusCobranca, TipoCobranca } from '../types/cobrancas';

interface CobrancasPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useCobrancasCacheFirst() {
  const { cobrancas, sync } = useDataStore();
  const [filters, setFilters] = useState<CobrancasFilters>({});
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // DataGrid usa 0-based pagination
    pageSize: 25,
  });

  const filteredCobrancas = useMemo(() => {
    let result = [...cobrancas];

    if (filters.codigo_unidade) {
      result = result.filter(c => c.codigo_unidade === filters.codigo_unidade);
    }
    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.tipo_cobranca) {
      result = result.filter(c => c.tipo_cobranca === filters.tipo_cobranca);
    }
    // Adicionar busca por termo
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(c => 
        c.observacoes?.toLowerCase().includes(searchLower) ||
        c.codigo_unidade.toString().includes(searchLower)
      );
    }

    return result;
  }, [cobrancas, filters]);

  const paginatedCobrancas = useMemo(() => {
    const startIndex = paginationModel.page * paginationModel.pageSize;
    const endIndex = startIndex + paginationModel.pageSize;
    return filteredCobrancas.slice(startIndex, endIndex);
  }, [filteredCobrancas, paginationModel]);

  const handleFilterChange = (newFilters: CobrancasFilters) => {
    setFilters(newFilters);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handlePaginationModelChange = (newModel: { page: number; pageSize: number }) => {
    setPaginationModel(newModel);
  };

  const isLoading = !sync.lastSyncAt || sync.isLoading;

  return {
    cobrancas: paginatedCobrancas,
    total: filteredCobrancas.length,
    filters,
    pagination: {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
    },
    isLoading,
    handleFilterChange,
    handlePaginationModelChange,
    refetch: useDataStore.getState().refreshData,
  };
}