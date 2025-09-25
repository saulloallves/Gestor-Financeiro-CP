import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';

export function useUnidadesEstatisticas() {
  const unidades = useDataStore((state) => state.unidades);
  const isLoading = useDataStore((state) => !state.sync.hasInitialLoad || state.sync.isLoading);

  const data = useMemo(() => {
    return {
      total: unidades.length,
      operacao: unidades.filter(u => u.status === 'OPERAÇÃO').length,
      implantacao: unidades.filter(u => u.status === 'IMPLANTAÇÃO').length,
      suspenso: unidades.filter(u => u.status === 'SUSPENSO').length,
      cancelado: unidades.filter(u => u.status === 'CANCELADO').length,
    };
  }, [unidades]);

  return { data, isLoading };
}