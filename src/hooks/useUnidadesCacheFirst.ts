import { useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import type { UnidadeFilter } from '../types/unidades';

interface UnidadesPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useUnidadesCacheFirst() {
  const { unidades, sync } = useDataStore();
  const [filters, setFilters] = useState<UnidadeFilter>({});
  const [pagination, setPagination] = useState({
    page: 0, // DataGrid usa 0-based pagination
    pageSize: 50,
  });

  const filteredUnidades = useMemo(() => {
    let result = [...unidades];

    if (filters.nome_padrao) {
      const searchLower = filters.nome_padrao.toLowerCase();
      result = result.filter(u => 
        u.nome_padrao.toLowerCase().includes(searchLower) ||
        u.codigo_unidade.includes(searchLower)
      );
    }
    if (filters.status && filters.status.length > 0) {
      result = result.filter(u => filters.status?.includes(u.status));
    }

    return result;
  }, [unidades, filters]);

  const paginatedUnidades = useMemo(() => {
    const startIndex = pagination.page * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredUnidades.slice(startIndex, endIndex);
  }, [filteredUnidades, pagination]);

  const paginationData: UnidadesPagination = useMemo(() => {
    const total = filteredUnidades.length;
    const totalPages = Math.ceil(total / pagination.pageSize);
    
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages,
    };
  }, [filteredUnidades.length, pagination]);

  const handleFilterChange = (newFilters: UnidadeFilter) => {
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
    unidades: paginatedUnidades,
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