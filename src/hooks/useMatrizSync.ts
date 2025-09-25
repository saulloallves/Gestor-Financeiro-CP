import { useState } from 'react';
import { matrizSyncService, type SyncStats } from '../api/matrizSyncService';
import toast from 'react-hot-toast';

export function useMatrizSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [progressMessage, setProgressMessage] = useState('');

  const startSync = async () => {
    setIsLoading(true);
    setError(null);
    setStats(null);
    setProgressMessage('Iniciando sincronização...');
    
    const toastId = toast.loading('Iniciando sincronização com a matriz...');

    try {
      const result = await matrizSyncService.syncAllMatrizData((currentStats, message) => {
        setStats(currentStats);
        setProgressMessage(message);
        toast.loading(message, { id: toastId });
      });
      
      setStats(result);
      toast.success(
        `Sincronização concluída! ${result.unidades.synced} unidades e ${result.franqueados.synced} franqueados sincronizados.`,
        { id: toastId, duration: 6000 }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(`Erro na sincronização: ${errorMessage}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    stats,
    progressMessage,
    startSync,
  };
}