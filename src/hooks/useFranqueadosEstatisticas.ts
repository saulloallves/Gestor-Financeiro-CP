import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';

export function useFranqueadosEstatisticas() {
  const franqueados = useDataStore((state) => state.franqueados);
  const isLoading = useDataStore((state) => !state.sync.hasInitialLoad || state.sync.isLoading);

  const data = useMemo(() => {
    return {
      total: franqueados.length,
      ativos: franqueados.filter(f => f.status === 'ativo').length,
      inativos: franqueados.filter(f => f.status === 'inativo').length,
      principais: franqueados.filter(f => f.tipo === 'principal').length,
    };
  }, [franqueados]);

  return { data, isLoading };
}