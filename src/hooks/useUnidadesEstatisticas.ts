import { useDataStore } from '../store/dataStore';

export function useUnidadesEstatisticas() {
  const data = useDataStore((state) => state.getEstatisticasUnidades());
  const isLoading = useDataStore((state) => !state.sync.hasInitialLoad || state.sync.isLoading);

  return { data, isLoading };
}