import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';

export function useCobrancasEstatisticas() {
  const cobrancas = useDataStore((state) => state.cobrancas);
  const isLoading = useDataStore((state) => !state.sync.hasInitialLoad || state.sync.isLoading);

  const data = useMemo(() => {
    const estatisticas = {
      totalCobrancas: cobrancas.length,
      valorTotalEmAberto: 0,
      valorTotalVencido: 0,
      cobrancasVencidas: 0,
      cobrancasPagas: 0,
      cobrancasPendentes: 0,
    };

    const statusVencido = ['vencido', 'em_atraso', 'atrasado', 'juridico'];
    const statusPendente = ['pendente', 'em_aberto'];

    cobrancas.forEach(cobranca => {
      if (cobranca.status === 'pago') {
        estatisticas.cobrancasPagas++;
      } else if (statusVencido.includes(cobranca.status)) {
        estatisticas.cobrancasVencidas++;
        estatisticas.valorTotalVencido += Number(cobranca.valor_atualizado || 0);
        estatisticas.valorTotalEmAberto += Number(cobranca.valor_atualizado || 0);
      } else if (statusPendente.includes(cobranca.status)) {
        estatisticas.cobrancasPendentes++;
        estatisticas.valorTotalEmAberto += Number(cobranca.valor_atualizado || 0);
      } else if (cobranca.status !== 'cancelado' && cobranca.status !== 'negociado' && cobranca.status !== 'parcelado') {
        // Outros status que contam como "em aberto"
        estatisticas.valorTotalEmAberto += Number(cobranca.valor_atualizado || 0);
      }
    });
    return estatisticas;
  }, [cobrancas]);

  return { data, isLoading };
}