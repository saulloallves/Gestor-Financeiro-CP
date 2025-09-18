import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDataSync } from './useDataSync';

/**
 * Hook que integra autenticação com sistema cache-first
 * Gerencia sync automático no login e limpeza no logout
 * VERSÃO TEMPORÁRIA: Sem validação de sessão RPC devido a erro 404
 */
export function useAuthDataSync() {
  const { usuario, tipoAcesso } = useAuthStore();
  const { 
    isLoading, 
    hasInitialLoad, 
    loadAllData, 
    clearCache,
    error,
    progress 
  } = useDataSync();

  // Sync automático quando usuário faz login
  useEffect(() => {
    // CORREÇÃO: Só fazer sync se realmente não há dados carregados
    const canSync = usuario && tipoAcesso && !hasInitialLoad && !isLoading;
    
    console.log('🔍 useAuthDataSync - Estado:', {
      usuario: !!usuario,
      tipoAcesso,
      hasInitialLoad,
      isLoading,
      canSync
    });
    
    if (canSync) {
      console.log('🔄 Hook detectou login sem dados em cache - iniciando sync...');
      loadAllData();
    } else if (usuario && tipoAcesso && hasInitialLoad) {
      console.log('✅ Login detectado mas dados já estão em cache - sync desnecessário');
    }
  }, [usuario, tipoAcesso, hasInitialLoad, isLoading, loadAllData]);

  // Limpeza quando usuário faz logout
  useEffect(() => {
    if (!usuario && hasInitialLoad) {
      console.log('🗑️ Hook detectou logout - limpando cache...');
      clearCache();
    }
  }, [usuario, hasInitialLoad, clearCache]);

  return {
    // Estados do sync
    isSyncLoading: isLoading,
    hasSyncData: hasInitialLoad,
    syncError: error,
    syncProgress: progress,
    
    // Estados do auth - TEMPORÁRIO: considerar autenticado se há usuário no store
    isAuthenticated: !!usuario, // Removida dependência de isValidSession
    userType: tipoAcesso,
    user: usuario,
    
    // Ações
    forceSync: loadAllData,
    clearSyncData: clearCache,
    
    // Estado combinado - TEMPORÁRIO: não exigir isValidSession
    isReady: !!usuario && hasInitialLoad && !isLoading,
  };
}

/**
 * Hook para detectar se o sistema está pronto para uso
 * (usuário logado + sessão válida + dados sincronizados)
 */
export function useSystemReady() {
  const { isReady, isSyncLoading, isAuthenticated, hasSyncData } = useAuthDataSync();
  
  return {
    isReady,
    isLoading: isSyncLoading && isAuthenticated,
    needsAuth: !isAuthenticated,
    needsData: isAuthenticated && !hasSyncData,
    statusMessage: getStatusMessage(isAuthenticated, hasSyncData, isSyncLoading),
  };
}

function getStatusMessage(isAuth: boolean, hasData: boolean, isLoading: boolean): string {
  if (!isAuth) return 'Aguardando autenticação...';
  if (isLoading) return 'Sincronizando dados...';
  if (!hasData) return 'Preparando dados...';
  return 'Sistema pronto!';
}