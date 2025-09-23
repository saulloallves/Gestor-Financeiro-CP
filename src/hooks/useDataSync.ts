import { useCallback, useEffect } from 'react';
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
  loadAllData: (force?: boolean) => Promise<void>;
  refreshData: (force?: boolean) => Promise<void>;
  clearCache: () => void;
  
  // Estatísticas
  stats: {
    franqueados: number;
    cobrancas: number;
    unidades: number;
    usuariosInternos: number;
  };
}

export function useDataSync(): UseDataSyncReturn {
  const {
    sync,
    franqueados,
    cobrancas,
    unidades,
    usuariosInternos,
    clearCache: clearStoreCache,
  } = useDataStore();

  // Configurar callback de progresso do serviço
  useEffect(() => {
    syncService.setProgressCallback((progress) => {
      useDataStore.setState((state) => {
        state.sync.progress = progress;
      });
    });
  }, []);

  const loadAllData = useCallback(async (force = false) => {
    const store = useDataStore.getState();
    
    const hasData = 
      store.franqueados.length > 0 && 
      store.unidades.length > 0 &&
      store.cobrancas.length > 0 &&
      store.usuariosInternos.length > 0;
      
    const hasCacheValid = store.sync.hasInitialLoad && hasData;
    
    if (hasCacheValid && !force) {
      console.log('✅ Dados já estão em cache - ignorando nova sincronização');
      return;
    }
    
    if (store.sync.isLoading) {
      console.log('Sincronização já em andamento, ignorando...');
      return;
    }

    console.log(`🔄 ${force ? 'Forçando' : 'Iniciando'} sincronização completa de dados...`);

    useDataStore.getState().loadAllData(force);
  }, []);

  const refreshData = useCallback(async (force = false) => {
    console.log(`🔄 Iniciando refresh de dados (force=${force})...`);
    await useDataStore.getState().refreshData(force);
  }, []);

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
    // Estados
    isLoading: sync.isLoading,
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
      unidades: unidades.length,
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
    
    // Estatísticas calculadas
    estatisticas: getEstatisticasCobrancas(),
  };
}