import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';

export function useCobrancasEstatisticas() {
  const cobrancas = useDataStore((state) => state.cobrancas);
  const isLoading = useDataStore((state) => !state.sync.hasInitialLoad || state.sync.isLoading);

  const data = useMemo(() => {
    const dataAtual = new Date();
    const estatisticas = {
      totalCobrancas: cobrancas.length,
      valorTotalEmAberto: 0,
      valorTotalVencido: 0,
      cobrancasVencidas: 0,
      cobrancasPagas: 0,
    };

    cobrancas.forEach(cobranca => {
      const dataVencimento = new Date(cobranca.vencimento);
      const isVencida = dataVencimento < dataAtual;

      if (cobranca.status === 'pago') {
        estatisticas.cobrancasPagas++;
      } else {
        estatisticas.valorTotalEmAberto += Number(cobranca.valor_atualizado || 0);
        if (isVencida) {
          estatisticas.cobrancasVencidas++;
          estatisticas.valorTotalVencido += Number(cobranca.valor_atualizado || 0);
        }
      }
    });
    return estatisticas;
  }, [cobrancas]);

  return { data, isLoading };
}