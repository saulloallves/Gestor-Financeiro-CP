import { useCallback, useEffect, useState, useRef } from 'react';
import { useDataStore } from '../store/dataStore';
import { syncService } from '../services/syncService';
import toast from 'react-hot-toast';

export interface UseDataSyncReturn {
  // Estados
  isLoading: boolean;
  hasInitialLoad: boolean;
  lastSyncAt: Date | string | null;
  error: string | null;
  progress: {
    current: number;
    total: number;
    stage: string;
  } | null;
  
  // Ações
  loadAllData: () => Promise<void>;
  refreshData: (force?: boolean) => Promise<void>;
  clearCache: () => void;
  
  // Estatísticas
  stats: {
    franqueados: number;
    cobrancas: number;
    usuariosInternos: number;
  };
}

export function useDataSync(): UseDataSyncReturn {
  const {
    sync,
    franqueados,
    cobrancas,
    usuariosInternos,
    clearCache: clearStoreCache,
  } = useDataStore();

  // Controle de tempo mínimo para skeleton (5 segundos)
  const [isMinimumLoadingTime, setIsMinimumLoadingTime] = useState(false);
  const loadingStartTime = useRef<number | null>(null);

  // Configurar callback de progresso do serviço
  useEffect(() => {
    syncService.setProgressCallback((progress) => {
      useDataStore.setState((state) => {
        state.sync.progress = progress;
      });
    });
  }, []);

  const loadAllData = useCallback(async () => {
    const store = useDataStore.getState();
    
    // CORREÇÃO: Verificar se já há dados em cache antes de recarregar
    const hasData = store.franqueados.length > 0 && store.cobrancas.length > 0;
    const hasCacheValid = store.sync.hasInitialLoad && hasData;
    
    console.log('🔍 Verificando estado do cache:', {
      hasInitialLoad: store.sync.hasInitialLoad,
      franqueados: store.franqueados.length,
      cobrancas: store.cobrancas.length,
      hasCacheValid
    });
    
    if (hasCacheValid) {
      console.log('✅ Dados já estão em cache - ignorando nova sincronização');
      return;
    }
    
    // Evitar múltiplas sincronizações simultâneas
    if (store.sync.isLoading || isMinimumLoadingTime) {
      console.log('Sincronização já em andamento, ignorando...');
      return;
    }

    console.log('🔄 Cache vazio ou incompleto - executando sincronização...');

    // Marcar início do loading e timer
    loadingStartTime.current = Date.now();
    setIsMinimumLoadingTime(true);

    // Atualizar estado de loading
    useDataStore.setState((state) => {
      state.sync.isLoading = true;
      state.sync.error = null;
      state.sync.progress = { current: 0, total: 3, stage: 'Iniciando...' };
    });

    // Timer mínimo de 5 segundos para evitar mudanças muito rápidas
    const minimumLoadingPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsMinimumLoadingTime(false);
        resolve();
      }, 5000);
    });

    try {
      console.log('🔄 Iniciando sincronização completa de dados...');
      
      const result = await syncService.syncAllData();

      if (result.success && result.data) {
        // Mostrar progresso que está aguardando tempo mínimo
        useDataStore.setState((state) => {
          state.sync.progress = { 
            current: 3, 
            total: 3, 
            stage: 'Finalizando carregamento...' 
          };
        });

        // Aguardar tempo mínimo antes de finalizar
        await minimumLoadingPromise;

        // Atualizar store com os dados sincronizados
        useDataStore.setState((state) => {
          state.franqueados = result.data!.franqueados;
          state.cobrancas = result.data!.cobrancas;
          state.usuariosInternos = result.data!.usuariosInternos;
          
          state.sync.isLoading = false;
          state.sync.hasInitialLoad = true;
          state.sync.lastSyncAt = new Date();
          state.sync.error = null;
          state.sync.progress = null;
        });

        const totalTime = Date.now() - (loadingStartTime.current || 0);
        console.log(`✅ Sincronização concluída em ${totalTime}ms (mínimo 5s aplicado)`);

        // Mostrar estatísticas de sucesso
        if (result.stats) {
          const { franqueados, cobrancas, usuariosInternos } = result.stats;
          
          toast.success(
            `Dados sincronizados! ${franqueados} franqueados, ${cobrancas} cobranças, ${usuariosInternos} usuários`
          );
        }
      } else {
        // Aguardar tempo mínimo mesmo em caso de erro
        await minimumLoadingPromise;
        throw new Error(result.error || 'Erro desconhecido na sincronização');
      }
    } catch (error) {
      // Aguardar tempo mínimo em caso de erro
      await minimumLoadingPromise;
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      console.error('❌ Erro na sincronização:', error);
      
      useDataStore.setState((state) => {
        state.sync.isLoading = false;
        state.sync.error = errorMessage;
        state.sync.progress = null;
      });

      toast.error(`Erro na sincronização: ${errorMessage}`);
    } finally {
      loadingStartTime.current = null;
    }
  }, [isMinimumLoadingTime, setIsMinimumLoadingTime]);

  const refreshData = useCallback(async (force = false) => {
    const { lastSyncAt, isLoading } = useDataStore.getState().sync;
    
    // Evitar refresh se já carregando ou no timer mínimo
    if (isLoading || isMinimumLoadingTime) {
      return;
    }
    
    // Se não forçar e a última sync foi há menos de 5 minutos, pular
    if (!force && lastSyncAt) {
      const syncDate = lastSyncAt instanceof Date ? lastSyncAt : new Date(lastSyncAt);
      if ((Date.now() - syncDate.getTime()) < 5 * 60 * 1000) {
        console.log('Dados ainda são recentes, pulando refresh...');
        toast('Dados já estão atualizados', { icon: 'ℹ️' });
        return;
      }
    }

    console.log('🔄 Iniciando refresh de dados...');
    await loadAllData();
  }, [loadAllData, isMinimumLoadingTime]);

  const clearCache = useCallback(() => {
    clearStoreCache();
    toast('Cache limpo com sucesso', { icon: '🗑️' });
  }, [clearStoreCache]);

  // Auto-load inicial se necessário
  useEffect(() => {
    const { hasInitialLoad, isLoading } = useDataStore.getState().sync;
    
    if (!hasInitialLoad && !isLoading) {
      console.log('🚀 Carregamento inicial de dados...');
      loadAllData();
    }
  }, [loadAllData]);

  return {
    // Estados (loading considera tanto o sync real quanto o timer mínimo)
    isLoading: sync.isLoading || isMinimumLoadingTime,
    hasInitialLoad: sync.hasInitialLoad,
    lastSyncAt: sync.lastSyncAt,
    error: sync.error,
    progress: sync.progress,
    
    // Ações
    loadAllData,
    refreshData,
    clearCache,
    
    // Estatísticas
    stats: {
      franqueados: franqueados.length,
      cobrancas: cobrancas.length,
      usuariosInternos: usuariosInternos.length,
    },
  };
}

// Hook para dados específicos com cache-first
export function useLocalData() {
  const {
    franqueados,
    cobrancas,
    usuariosInternos,
    getCobrancaById,
    getCobrancasByStatus,
    getCobrancasByUnidade,
    getFranqueadoById,
    getFranqueadoByCpf,
    getFranqueadosAtivos,
    getEstatisticasCobrancas,
  } = useDataStore();

  return {
    // Dados brutos
    franqueados,
    cobrancas,
    usuariosInternos,
    
    // Métodos de busca otimizados
    getCobrancaById,
    getCobrancasByStatus,
    getCobrancasByUnidade,
    getFranqueadoById,
    getFranqueadoByCpf,
    getFranqueadosAtivos,
    getEstatisticasCobrancas,
    
    // Estatísticas calculadas
    estatisticas: getEstatisticasCobrancas(),
  };
}