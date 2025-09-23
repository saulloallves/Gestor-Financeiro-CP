import { useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import type { StatusUnidade } from '../types/unidades';

// Interface para filtros de unidades
interface UnidadeFilters {
  searchTerm: string;
  status: StatusUnidade | '';
}

// Interface para estatísticas de unidades
interface UnidadesEstatisticas {
  total: number;
  operacao: number;
  implantacao: number;
  suspenso: number;
  cancelado: number;
}

// Interface para paginação
interface UnidadesPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useUnidadesCacheFirst() {
  const { unidades, sync } = useDataStore();
  const [filters, setFilters] = useState<UnidadeFilters>({
    searchTerm: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    page: 0, // DataGrid usa 0-based pagination
    pageSize: 50,
  });

  // Filtrar unidades baseado nos filtros atuais
  const filteredUnidades = useMemo(() => {
    let result = [...unidades];

    // Filtro por termo de busca
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(unidade => 
        unidade.nome_padrao?.toLowerCase().includes(searchLower) ||
        unidade.codigo_unidade?.toLowerCase().includes(searchLower) ||
        unidade.nome_grupo?.toLowerCase().includes(searchLower) ||
        unidade.endereco_cidade?.toLowerCase().includes(searchLower) ||
        unidade.endereco_uf?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por status
    if (filters.status) {
      result = result.filter(unidade => unidade.status === filters.status);
    }

    return result;
  }, [unidades, filters]);

  // Aplicar paginação
  const paginatedUnidades = useMemo(() => {
    const startIndex = pagination.page * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredUnidades.slice(startIndex, endIndex);
  }, [filteredUnidades, pagination]);

  // Calcular dados de paginação
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

  // Handlers para filtros
  const handleFilterChange = (key: keyof UnidadeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset para primeira página
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 0 }));
  };

  // Status de carregamento baseado no cache
  const isLoading = !sync.lastSyncAt || sync.isLoading;

  return {
    // Dados
    unidades: paginatedUnidades,
    total: paginationData.total,
    totalPages: paginationData.totalPages,
    
    // Estado atual
    filters,
    pagination: paginationData,
    
    // Status
    isLoading,
    isError: false, // Cache não tem erro, seria sempre false
    hasInitialLoad: !!sync.lastSyncAt,
    
    // Handlers
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    
    // Para compatibilidade com a interface existente
    setSearchTerm: (term: string) => handleFilterChange('searchTerm', term),
    setStatusFilter: (status: StatusUnidade | '') => handleFilterChange('status', status),
    
    // Função de refetch (força sync do cache)
    refetch: useDataStore.getState().refreshData,
  };
}

export function useUnidadesEstatisticasCacheFirst() {
  const { unidades, sync } = useDataStore();

  // Calcular estatísticas das unidades do cache
  const estatisticas: UnidadesEstatisticas = useMemo(() => {
    const total = unidades.length;
    const operacao = unidades.filter(u => u.status === 'OPERAÇÃO').length;
    const implantacao = unidades.filter(u => u.status === 'IMPLANTAÇÃO').length;
    const suspenso = unidades.filter(u => u.status === 'SUSPENSO').length;
    const cancelado = unidades.filter(u => u.status === 'CANCELADO').length;

    return {
      total,
      operacao,
      implantacao,
      suspenso,
      cancelado,
    };
  }, [unidades]);

  const isLoading = !sync.lastSyncAt || sync.isLoading;

  return {
    data: estatisticas,
    isLoading,
    isError: false,
    hasInitialLoad: !!sync.lastSyncAt,
  };
}

export function useUnidadesPageCacheFirst() {
  const {
    unidades,
    total,
    totalPages,
    filters,
    pagination,
    isLoading,
    isError,
    hasInitialLoad,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    setSearchTerm,
    setStatusFilter,
    refetch,
  } = useUnidadesCacheFirst();

  return {
    // Dados principais
    unidades,
    total,
    totalPages,
    
    // Estado de filtros e paginação
    filters,
    pagination,
    
    // Status
    isLoading,
    isError,
    hasInitialLoad,
    
    // Handlers
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    setSearchTerm,
    setStatusFilter,
    refetch,
  };
}