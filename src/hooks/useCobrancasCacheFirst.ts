import { useState, useMemo, useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import type { Cobranca, CobrancasFilters } from '../types/cobrancas';

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
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(c => 
        c.observacoes?.toLowerCase().includes(searchLower) ||
        c.codigo_unidade.toString().includes(searchLower)
      );
    }

    return result;
  }, [cobrancas, filters]);

  // Efeito para corrigir a página se ela se tornar inválida após a filtragem
  useEffect(() => {
    const total = filteredCobrancas.length;
    const totalPages = Math.ceil(total / paginationModel.pageSize);
    if (paginationModel.page >= totalPages && totalPages > 0) {
      setPaginationModel(prev => ({ ...prev, page: totalPages - 1 }));
    } else if (total === 0 && paginationModel.page !== 0) {
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }
  }, [filteredCobrancas.length, paginationModel]);

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
    pagination: paginationModel,
    isLoading,
    handleFilterChange,
    handlePaginationModelChange,
    refetch: useDataStore.getState().refreshData,
  };
}