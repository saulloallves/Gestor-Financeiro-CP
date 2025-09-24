import { useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import type { CobrancasFilters } from '../types/cobrancas';

export function useCobrancasCacheFirst() {
  const { cobrancas, sync } = useDataStore();
  const [filters, setFilters] = useState<CobrancasFilters>({});

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

  const handleFilterChange = (newFilters: CobrancasFilters) => {
    setFilters(newFilters);
  };

  const isLoading = !sync.lastSyncAt || sync.isLoading;

  return {
    cobrancas: filteredCobrancas,
    isLoading,
    filters,
    handleFilterChange,
    refetch: useDataStore.getState().refreshData,
  };
}