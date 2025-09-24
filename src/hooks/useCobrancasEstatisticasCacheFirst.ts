import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';

// Interface para as estatísticas de cobranças
export interface CobrancasEstatisticas {
  total: number;
  pagas: number;
  vencidas: number;
  emAberto: number;
  valorTotalEmAberto: number;
}

export function useCobrancasEstatisticasCacheFirst() {
  const { cobrancas, sync } = useDataStore();

  // Calcular estatísticas das cobranças do cache
  const estatisticas: CobrancasEstatisticas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Para comparar apenas a data

    const total = cobrancas.length;
    const pagas = cobrancas.filter(c => c.status === 'pago').length;
    
    const vencidas = cobrancas.filter(c => {
      const vencimento = new Date(c.vencimento);
      return (c.status === 'vencido' || c.status === 'em_atraso') && vencimento < hoje;
    }).length;

    const emAberto = cobrancas.filter(c => 
      c.status === 'pendente' || c.status === 'em_aberto'
    ).length;

    const valorTotalEmAberto = cobrancas
      .filter(c => ['pendente', 'em_aberto', 'vencido', 'em_atraso'].includes(c.status))
      .reduce((acc, c) => acc + (c.valor_atualizado || 0), 0);

    return {
      total,
      pagas,
      vencidas,
      emAberto,
      valorTotalEmAberto,
    };
  }, [cobrancas]);

  const isLoading = !sync.lastSyncAt || sync.isLoading;

  return {
    data: estatisticas,
    isLoading,
    isError: !!sync.error,
    hasInitialLoad: !!sync.lastSyncAt,
  };
}