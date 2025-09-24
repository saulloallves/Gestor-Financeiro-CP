import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';

// Interface para estatísticas do dashboard
export interface DashboardStats {
  // Estatísticas de Franqueados (cache-first)
  totalFranqueados: number;
  franqueadosAtivos: number;
  
  // Estatísticas de Unidades (cache-first)
  totalUnidades: number;
  unidadesOperacao: number;
  
  // Estatísticas de Cobranças (agora do cache)
  totalCobrancas: number;
  cobrancasPendentes: number;
  cobrancasVencidas: number;
  valorTotalPendente: number;
  valorRecebidoMes: number;
  
  // Status de carregamento
  isLoading: boolean;
}

export function useDashboardStatsCacheFirst(): DashboardStats {
  const { franqueados, unidades, cobrancas, sync } = useDataStore();
  
  const isLoading = !sync.hasInitialLoad || sync.isLoading;

  // Calcular todas as estatísticas usando useMemo para otimização
  const stats = useMemo(() => {
    // Franqueados
    const totalFranqueados = franqueados.length;
    const franqueadosAtivos = franqueados.filter(f => f.status === 'ativo').length;
    
    // Unidades
    const totalUnidades = unidades.length;
    const unidadesOperacao = unidades.filter(u => u.status === 'OPERAÇÃO').length;

    // Cobranças
    const totalCobrancas = cobrancas.length;
    const cobrancasPendentes = cobrancas.filter(c => c.status === 'pendente' || c.status === 'em_aberto' || c.status === 'vencido' || c.status === 'em_atraso').length;
    
    const hoje = new Date();
    const cobrancasVencidas = cobrancas.filter(c => 
      (c.status === 'vencido' || c.status === 'em_atraso') && new Date(c.vencimento) < hoje
    ).length;

    const valorTotalPendente = cobrancas
      .filter(c => c.status === 'pendente' || c.status === 'em_aberto' || c.status === 'vencido' || c.status === 'em_atraso')
      .reduce((sum, c) => sum + (c.valor_atualizado || 0), 0);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const valorRecebidoMes = cobrancas
      .filter(c => c.status === 'pago' && new Date(c.updated_at) >= inicioMes)
      .reduce((sum, c) => sum + (c.valor_atualizado || 0), 0);

    return {
      totalFranqueados,
      franqueadosAtivos,
      totalUnidades,
      unidadesOperacao,
      totalCobrancas,
      cobrancasPendentes,
      cobrancasVencidas,
      valorTotalPendente,
      valorRecebidoMes,
    };
  }, [franqueados, unidades, cobrancas]);

  return {
    ...stats,
    isLoading,
  };
}

export function useDashboardCacheFirst() {
  const stats = useDashboardStatsCacheFirst();
  const { sync } = useDataStore();

  // Formatar dados para os cards do dashboard
  const cardData = useMemo(() => {
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value);

    return [
      {
        title: "Total a Receber",
        value: formatCurrency(stats.valorTotalPendente),
        change: stats.cobrancasVencidas > 0 ? `-${stats.cobrancasVencidas} venc.` : '+0',
        icon: 'DollarSign',
        color: "primary.main" as const,
      },
      {
        title: "Receitas do Mês",
        value: formatCurrency(stats.valorRecebidoMes),
        change: "+8,3%", // Placeholder
        icon: 'TrendingUp',
        color: "success.main" as const,
      },
      {
        title: "Franqueados Ativos",
        value: stats.franqueadosAtivos.toString(),
        change: `de ${stats.totalFranqueados}`,
        icon: 'Users',
        color: "secondary.main" as const,
      },
      {
        title: "Cobranças Pendentes",
        value: stats.cobrancasPendentes.toString(),
        change: stats.cobrancasVencidas > 0 ? `-${stats.cobrancasVencidas} venc.` : '+0',
        icon: 'Clock',
        color: "warning.main" as const,
      },
    ];
  }, [stats]);

  // Alertas baseados nos dados
  const alerts = useMemo(() => {
    const alertsList = [];
    const lastSyncText = sync.lastSyncAt 
      ? new Date(sync.lastSyncAt).toLocaleString('pt-BR')
      : 'Nunca';

    alertsList.push({
      type: 'success' as const,
      title: '✓ Sistema funcionando normalmente',
      description: `Cache atualizado: ${lastSyncText}`,
    });

    if (stats.cobrancasVencidas > 0) {
      alertsList.push({
        type: 'warning' as const,
        title: `${stats.cobrancasVencidas} cobranças vencidas requerem atenção`,
        description: 'Verificar cobranças vencidas no painel de gestão',
      });
    }

    return alertsList;
  }, [stats.cobrancasVencidas, sync.lastSyncAt]);

  return {
    cardData,
    alerts,
    stats,
    isLoading: stats.isLoading,
    isLoadingCache: stats.isLoading, // Unificado
    isLoadingCobrancas: stats.isLoading, // Unificado
  };
}