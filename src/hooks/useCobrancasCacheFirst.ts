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
  const [pagination, setPagination] = useState({
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
    const startIndex = pagination.page * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredCobrancas.slice(startIndex, endIndex);
  }, [filteredCobrancas, pagination]);

  const paginationData: CobrancasPagination = useMemo(() => {
    const total = filteredCobrancas.length;
    const totalPages = Math.ceil(total / pagination.pageSize);
    
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages,
    };
  }, [filteredCobrancas.length, pagination]);

  const handleFilterChange = (newFilters: CobrancasFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 0 }));
  };

  const isLoading = !sync.lastSyncAt || sync.isLoading;

  return {
    cobrancas: paginatedCobrancas,
    total: paginationData.total,
    filters,
    pagination: paginationData,
    isLoading,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    refetch: useDataStore.getState().refreshData,
  };
}