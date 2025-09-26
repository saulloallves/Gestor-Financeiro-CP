import { useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';

interface ComunicacoesFilters {
  searchTerm: string;
  canal: '' | 'whatsapp' | 'email';
}

interface ComunicacoesPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useComunicacoesCacheFirst() {
  const { comunicacoes, sync } = useDataStore();
  const [filters, setFilters] = useState<ComunicacoesFilters>({
    searchTerm: '',
    canal: '',
  });
  const [pagination, setPagination] = useState({
    page: 0, // DataGrid usa 0-based pagination
    pageSize: 50,
  });

  const filteredComunicacoes = useMemo(() => {
    let result = [...comunicacoes];

    // Filtro por termo de busca
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(log =>
        log.franqueado_nome?.toLowerCase().includes(searchLower) ||
        log.unidade_codigo_unidade?.toLowerCase().includes(searchLower) ||
        log.conteudo?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por canal
    if (filters.canal) {
      result = result.filter(log => log.canal === filters.canal);
    }

    return result;
  }, [comunicacoes, filters]);

  const paginatedComunicacoes = useMemo(() => {
    const startIndex = pagination.page * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredComunicacoes.slice(startIndex, endIndex);
  }, [filteredComunicacoes, pagination]);

  const paginationData: ComunicacoesPagination = useMemo(() => {
    const total = filteredComunicacoes.length;
    const totalPages = Math.ceil(total / pagination.pageSize);
    
    return {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages,
    };
  }, [filteredComunicacoes.length, pagination]);

  const handleFilterChange = (key: keyof ComunicacoesFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
    comunicacoes: paginatedComunicacoes,
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