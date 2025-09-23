import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { autoSyncService } from '../api/autoSyncService';
import toast from 'react-hot-toast';

interface AutoSyncConfig {
  enabled: boolean;
  intervalMinutes: number;
  syncPayments: boolean;
  syncStatuses: boolean;
  paymentsSyncInterval: number;
}

/**
 * Hook para gerenciar a sincronização automática
 */
export function useAutoSync() {
  const queryClient = useQueryClient();

  // Status da sincronização automática
  const { data: syncStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['auto-sync-status'],
    queryFn: () => autoSyncService.getStatus(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Iniciar sincronização automática
  const startAutoSync = useMutation({
    mutationFn: (config?: Partial<AutoSyncConfig>) => {
      autoSyncService.startAutoSync(config);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Sincronização automática iniciada');
      refetchStatus();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao iniciar sincronização automática');
    },
  });

  // Parar sincronização automática
  const stopAutoSync = useMutation({
    mutationFn: () => {
      autoSyncService.stopAutoSync();
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Sincronização automática parada');
      refetchStatus();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao parar sincronização automática');
    },
  });

  // Sincronização completa
  const executeFullSync = useMutation({
    mutationFn: () => autoSyncService.executeFullSync(),
    onMutate: () => {
      toast.loading('Executando sincronização completa...', { id: 'full-sync' });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-cache-first'] });

      const { paymentsResult, statusResult, errors } = result;
      
      let message = 'Sincronização completa finalizada!';
      if (paymentsResult) {
        message += ` Payments: ${paymentsResult.created} criados, ${paymentsResult.updated} atualizados.`;
      }
      if (statusResult) {
        message += ` Status: ${statusResult.updated} atualizados.`;
      }
      
      toast.success(message, { id: 'full-sync', duration: 8000 });
      
      if (errors.length > 0) {
        toast.error(`${errors.length} erros encontrados. Verifique o console.`, { duration: 8000 });
        console.error('Erros na sincronização completa:', errors);
      }

      refetchStatus();
    },
    onError: (error: Error) => {
      toast.error(
        error.message || 'Erro na sincronização completa',
        { id: 'full-sync', duration: 8000 }
      );
    },
  });

  // Atualizar configuração
  const updateConfig = useMutation({
    mutationFn: (newConfig: Partial<AutoSyncConfig>) => {
      autoSyncService.updateConfig(newConfig);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Configuração atualizada');
      refetchStatus();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar configuração');
    },
  });

  // Inicializar sincronização automática na primeira carga
  useEffect(() => {
    // Configuração padrão para ambiente de produção
    const defaultConfig: Partial<AutoSyncConfig> = {
      enabled: true,
      intervalMinutes: 30, // Status a cada 30 minutos
      syncPayments: true,
      syncStatuses: true,
      paymentsSyncInterval: 4, // Payments a cada 4 horas
    };

    // Iniciar com configuração padrão após 10 segundos da carga da página
    const timer = setTimeout(() => {
      console.log('🚀 Iniciando sincronização automática com configuração padrão...');
      autoSyncService.startAutoSync(defaultConfig);
      refetchStatus();
    }, 10000);

    return () => clearTimeout(timer);
  }, [refetchStatus]); // Executar quando refetchStatus mudar

  return {
    // Estado
    syncStatus,
    
    // Mutations
    startAutoSync,
    stopAutoSync,
    executeFullSync,
    updateConfig,
    
    // Helpers
    isRunning: syncStatus?.isRunning || false,
    lastPaymentsSync: syncStatus?.lastPaymentsSync || null,
    lastStatusSync: syncStatus?.lastStatusSync || null,
    nextPaymentsSync: syncStatus?.nextPaymentsSync || null,
    nextStatusSync: syncStatus?.nextStatusSync || null,
    
    // Actions
    refetchStatus,
  };
}