import { useMutation, useQueryClient } from '@tanstack/react-query';
import { asaasSyncService } from '../api/asaasSyncService';
import toast from 'react-hot-toast';

interface SyncParams {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

/**
 * Hook para sincronizar payments do ASAAS
 */
export function useSyncAsaasPayments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params?: SyncParams) => asaasSyncService.syncAllPayments(params),
    onMutate: () => {
      toast.loading('Sincronizando payments do ASAAS...', { id: 'sync-payments' });
    },
    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-cache-first'] });
      
      toast.success(
        `Sincronização concluída! ${result.created} criadas, ${result.updated} atualizadas`,
        { id: 'sync-payments', duration: 5000 }
      );
      
      if (result.errors.length > 0) {
        toast.error(
          `${result.errors.length} erros encontrados. Verifique o console para detalhes.`,
          { duration: 8000 }
        );
        console.error('Erros na sincronização de payments:', result.errors);
      }
    },
    onError: (error: Error) => {
      toast.error(
        error.message || 'Erro na sincronização de payments',
        { id: 'sync-payments', duration: 8000 }
      );
      console.error('Erro na sincronização de payments:', error);
    },
  });
}

/**
 * Hook para sincronizar status das cobranças
 */
export function useSyncAsaasStatuses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => asaasSyncService.syncAllStatuses(),
    onMutate: () => {
      toast.loading('Sincronizando status das cobranças...', { id: 'sync-status' });
    },
    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-cache-first'] });
      
      if (result.updated > 0) {
        toast.success(
          `${result.updated} status atualizados com sucesso!`,
          { id: 'sync-status', duration: 4000 }
        );
      } else {
        toast.success(
          'Todos os status já estão atualizados',
          { id: 'sync-status', duration: 3000 }
        );
      }
      
      if (result.errors.length > 0) {
        toast.error(
          `${result.errors.length} erros encontrados. Verifique o console para detalhes.`,
          { duration: 8000 }
        );
        console.error('Erros na sincronização de status:', result.errors);
      }
    },
    onError: (error: Error) => {
      toast.error(
        error.message || 'Erro ao sincronizar status',
        { id: 'sync-status', duration: 8000 }
      );
      console.error('Erro na sincronização de status:', error);
    },
  });
}

/**
 * Hook para sincronizar payments por período específico
 */
export function useSyncAsaasPaymentsByDateRange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dateFrom, dateTo }: { dateFrom: string; dateTo: string }) => 
      asaasSyncService.syncPaymentsByDateRange(dateFrom, dateTo),
    onMutate: () => {
      toast.loading('Sincronizando payments por período...', { id: 'sync-date-range' });
    },
    onSuccess: (result) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['estatisticas-cobrancas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-cache-first'] });
      
      toast.success(
        `Sincronização por período concluída! ${result.created} criadas, ${result.updated} atualizadas`,
        { id: 'sync-date-range', duration: 5000 }
      );
      
      if (result.errors.length > 0) {
        toast.error(
          `${result.errors.length} erros encontrados. Verifique o console para detalhes.`,
          { duration: 8000 }
        );
        console.error('Erros na sincronização por período:', result.errors);
      }
    },
    onError: (error: Error) => {
      toast.error(
        error.message || 'Erro na sincronização por período',
        { id: 'sync-date-range', duration: 8000 }
      );
      console.error('Erro na sincronização por período:', error);
    },
  });
}

/**
 * Hook para buscar customer no ASAAS por CPF/CNPJ
 */
export function useFindAsaasCustomer() {
  return useMutation({
    mutationFn: (cpfCnpj: string) => asaasSyncService.findCustomerByCpfCnpj(cpfCnpj),
    onError: (error: Error) => {
      toast.error(
        error.message || 'Erro ao buscar customer no ASAAS',
        { duration: 5000 }
      );
      console.error('Erro ao buscar customer:', error);
    },
  });
}