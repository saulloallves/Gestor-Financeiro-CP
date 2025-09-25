import { useCobrancasEstatisticas } from './useCobrancasEstatisticas';
import { useFranqueadosEstatisticas } from './useFranqueadosEstatisticas';
import { useUnidadesEstatisticas } from './useUnidadesEstatisticas';

export function useDashboardStats() {
  const { data: cobrancasStats, isLoading: isLoadingCobrancas } = useCobrancasEstatisticas();
  const { data: franqueadosStats, isLoading: isLoadingFranqueados } = useFranqueadosEstatisticas();
  const { data: unidadesStats, isLoading: isLoadingUnidades } = useUnidadesEstatisticas();

  const isLoading = isLoadingCobrancas || isLoadingFranqueados || isLoadingUnidades;

  return {
    cobrancasStats,
    franqueadosStats,
    unidadesStats,
    isLoading,
  };
}