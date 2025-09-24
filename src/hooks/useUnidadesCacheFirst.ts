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

export function useUnidadesCacheFirst() {
  const { unidades, sync } = useDataStore();
  const [filters, setFilters] = useState<UnidadeFilters>({
    searchTerm: '',
    status: '',
  });
  const [paginationModel, setPaginationModel] = useState({
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
    const startIndex = paginationModel.page * paginationModel.pageSize;
    const endIndex = startIndex + paginationModel.pageSize;
    return filteredUnidades.slice(startIndex, endIndex);
  }, [filteredUnidades, paginationModel]);

  // Handlers para filtros
  const handleFilterChange = (key: keyof UnidadeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset para primeira página
  };

  const handlePaginationModelChange = (newModel: { page: number; pageSize: number }) => {
    setPaginationModel(newModel);
  };

  // Status de carregamento baseado no cache
  const isLoading = !sync.lastSyncAt || sync.isLoading;

  return {
    // Dados
    unidades: paginatedUnidades,
    total: filteredUnidades.length,
    
    // Estado atual
    filters,
    pagination: paginationModel,
    
    // Status
    isLoading,
    isError: false, // Cache não tem erro, seria sempre false
    hasInitialLoad: !!sync.lastSyncAt,
    
    // Handlers
    handleFilterChange,
    handlePaginationModelChange,
    
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
    filters,
    pagination,
    isLoading,
    isError,
    hasInitialLoad,
    handleFilterChange,
    handlePaginationModelChange,
    setSearchTerm,
    setStatusFilter,
    refetch,
  } = useUnidadesCacheFirst();

  return {
    // Dados principais
    unidades,
    total,
    
    // Estado de filtros e paginação
    filters,
    pagination,
    
    // Status
    isLoading,
    isError,
    hasInitialLoad,
    
    // Handlers
    handleFilterChange,
    handlePaginationModelChange,
    setSearchTerm,
    setStatusFilter,
    refetch,
  };
}