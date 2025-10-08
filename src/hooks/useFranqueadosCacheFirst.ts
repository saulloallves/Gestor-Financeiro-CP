import { useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import type { FranqueadoFilter } from '../types/franqueados';

interface FranqueadosPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useFranqueadosCacheFirst() {
  const { franqueados, sync } = useDataStore();
  const [filters, setFilters] = useState<FranqueadoFilter>({});
  const [pagination, setPagination] = useState({
    page: 0, // DataGrid usa 0-based pagination
    pageSize: 50,
  });

  const filteredFranqueados = useMemo(() => {
    let result = [...franqueados];

    if (filters.nome) {
      const searchLower = filters.nome.toLowerCase();
      result = result.filter(f => 
        f.nome.toLowerCase().includes(searchLower) ||
        f.cpf?.includes(searchLower)
      );
    }
    if (typeof filters.is_active_system === 'boolean') {
      result = result.filter(f => f.is_active_system === filters.is_active_system);
    }
    if (filters.tipo && filters.tipo.length > 0) {
      result = result.filter(f => filters.tipo?.includes(f.tipo));
    }

    return result;
  }, [franqueados, filters]);

  const paginatedFranqueados = useMemo(() => {
    const startIndex = pagination.page * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredFranqueados.slice(startIndex, endIndex);
  }, [filteredFranqueados, pagination]);

  const paginationData: FranqueadosPagination = useMemo(() => {
    const total = filteredFranqueados.length;
    const totalPages = Math.ceil(total / pagination.pageSize);
    
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages,
    };
  }, [filteredFranqueados.length, pagination]);

  const handleFilterChange = (newFilters: FranqueadoFilter) => {
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
    franqueados: paginatedFranqueados,
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