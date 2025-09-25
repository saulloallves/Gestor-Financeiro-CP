import { useDataStore } from '../store/dataStore';

export function useCobrancasEstatisticas() {
  const data = useDataStore((state) => state.getEstatisticasCobrancas());
  const isLoading = useDataStore((state) => !state.sync.hasInitialLoad || state.sync.isLoading);

  return { data, isLoading };
}