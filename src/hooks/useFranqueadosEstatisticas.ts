import { useDataStore } from '../store/dataStore';

export function useFranqueadosEstatisticas() {
  const data = useDataStore((state) => state.getEstatisticasFranqueados());
  const isLoading = useDataStore((state) => !state.sync.hasInitialLoad || state.sync.isLoading);

  return { data, isLoading };
}