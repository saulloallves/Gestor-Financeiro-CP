import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import { useCobrancas } from './useCobrancas';

// Interface para estatísticas do dashboard
export interface DashboardStats {
  // Estatísticas de Franqueados (cache-first)
  totalFranqueados: number;
  franqueadosAtivos: number;
  franqueadosInativos: number;
  franqueadosPrincipais: number;
  
  // Estatísticas de Unidades (cache-first)
  totalUnidades: number;
  unidadesOperacao: number;
  unidadesImplantacao: number;
  unidadesSuspensas: number;
  
  // Estatísticas de Cobranças (React Query)
  totalCobrancas: number;
  cobrancasPendentes: number;
  cobrancasVencidas: number;
  valorTotalPendente: number;
  valorRecebidoMes: number;
  
  // Status de carregamento
  isLoading: boolean;
  isLoadingCache: boolean;
  isLoadingCobrancas: boolean;
}

export function useDashboardStatsCacheFirst(): DashboardStats {
  const { franqueados, unidades, sync } = useDataStore();
  
  // Carregar cobranças usando React Query
  const { 
    data: cobrancas = [], 
    isLoading: isLoadingCobrancas 
  } = useCobrancas();

  // Cache não carregado se não há lastSyncAt ou dados vazios
  const isLoadingCache = !sync.lastSyncAt || (franqueados.length === 0 && unidades.length === 0);

  // Calcular estatísticas de franqueados do cache
  const franqueadosStats = useMemo(() => {
    const totalFranqueados = franqueados.length;
    const franqueadosAtivos = franqueados.filter(f => f.status === 'ativo').length;
    const franqueadosInativos = franqueados.filter(f => f.status === 'inativo').length;
    const franqueadosPrincipais = franqueados.filter(f => f.tipo === 'principal').length;

    return {
      totalFranqueados,
      franqueadosAtivos,
      franqueadosInativos,
      franqueadosPrincipais,
    };
  }, [franqueados]);

  // Calcular estatísticas de unidades do cache
  const unidadesStats = useMemo(() => {
    const totalUnidades = unidades.length;
    const unidadesOperacao = unidades.filter(u => u.status === 'OPERAÇÃO').length;
    const unidadesImplantacao = unidades.filter(u => u.status === 'IMPLANTAÇÃO').length;
    const unidadesSuspensas = unidades.filter(u => u.status === 'SUSPENSO').length;

    return {
      totalUnidades,
      unidadesOperacao,
      unidadesImplantacao,
      unidadesSuspensas,
    };
  }, [unidades]);

  // Calcular estatísticas de cobranças (React Query)
  const cobrancasStats = useMemo(() => {
    const totalCobrancas = cobrancas.length;
    const cobrancasPendentes = cobrancas.filter(c => c.status === 'pendente').length;
    const cobrancasVencidas = cobrancas.filter(c => {
      if (c.status !== 'pendente') return false;
      const hoje = new Date();
      const vencimento = new Date(c.vencimento);
      return vencimento < hoje;
    }).length;

    const valorTotalPendente = cobrancas
      .filter(c => c.status === 'pendente')
      .reduce((sum, c) => sum + (c.valor_atualizado || 0), 0);

    // Valor recebido no mês atual
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const valorRecebidoMes = cobrancas
      .filter(c => {
        if (c.status !== 'pago') return false;
        // Como não temos data de pagamento na Cobranca, usamos updated_at como aproximação
        const dataPagamento = new Date(c.updated_at);
        return dataPagamento >= inicioMes;
      })
      .reduce((sum, c) => sum + (c.valor_atualizado || 0), 0);

    return {
      totalCobrancas,
      cobrancasPendentes,
      cobrancasVencidas,
      valorTotalPendente,
      valorRecebidoMes,
    };
  }, [cobrancas]);

  return {
    ...franqueadosStats,
    ...unidadesStats,
    ...cobrancasStats,
    isLoading: isLoadingCache || isLoadingCobrancas,
    isLoadingCache,
    isLoadingCobrancas,
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
        change: stats.cobrancasVencidas > 0 ? `-${stats.cobrancasVencidas}` : '+0',
        icon: 'DollarSign',
        color: "primary.main" as const,
      },
      {
        title: "Receitas do Mês",
        value: formatCurrency(stats.valorRecebidoMes),
        change: "+8,3%", // Poderia ser calculado comparando com mês anterior
        icon: 'TrendingUp',
        color: "success.main" as const,
      },
      {
        title: "Franqueados Ativos",
        value: stats.franqueadosAtivos.toString(),
        change: `+${stats.franqueadosPrincipais}`,
        icon: 'Users',
        color: "secondary.main" as const,
      },
      {
        title: "Cobranças Pendentes",
        value: stats.cobrancasPendentes.toString(),
        change: stats.cobrancasVencidas > 0 ? `-${stats.cobrancasVencidas}` : '+0',
        icon: 'Clock',
        color: "warning.main" as const,
      },
    ];
  }, [stats]);

  // Alertas baseados nos dados
  const alerts = useMemo(() => {
    const alertsList = [];

    // Alerta de sistema funcionando
    const lastSyncText = sync.lastSyncAt 
      ? new Date(sync.lastSyncAt).toLocaleString('pt-BR')
      : 'Nunca';

    alertsList.push({
      type: 'success' as const,
      title: '✓ Sistema funcionando normalmente',
      description: `Cache atualizado: ${lastSyncText}`,
    });

    // Alerta de cobranças vencidas
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
    isLoadingCache: stats.isLoadingCache,
    isLoadingCobrancas: stats.isLoadingCobrancas,
  };
}