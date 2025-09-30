import { supabase } from '../api/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import { useDataStore } from '../store/dataStore';
import toast from 'react-hot-toast';

class RealtimeService {
  private channel: RealtimeChannel | null = null;
  private queryClient: QueryClient | null = null;

  public initialize(queryClient: QueryClient) {
    if (this.channel) {
      console.log('📡 [RealtimeService] Already initialized.');
      return;
    }
    
    this.queryClient = queryClient;
    console.log('📡 [RealtimeService] Initializing subscriptions...');

    this.channel = supabase.channel('matriz-updates');
    this.channel
      .on('broadcast', { event: 'db-change' }, ({ payload }) => {
        console.log('📡 [Realtime] Matriz update received:', payload);
        
        if (payload.table === 'unidades') {
          this.queryClient?.invalidateQueries({ queryKey: ['unidades'] });
          useDataStore.getState().refreshData();
          toast.success(`Dados da unidade ${payload.id} atualizados em tempo real!`);
        } else if (payload.table === 'franqueados') {
          this.queryClient?.invalidateQueries({ queryKey: ['franqueados'] });
          useDataStore.getState().refreshData();
          toast.success(`Dados do franqueado ${payload.id} atualizados em tempo real!`);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cobrancas' }, (payload) => {
        console.log('📡 [Realtime] Cobrança update received:', payload);
        useDataStore.getState().refreshData();
        toast.success(`Cobrança atualizada em tempo real!`);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RealtimeService] Subscribed to matriz-updates and cobrancas channels!');
        }
      });
  }

  public cleanup() {
    if (this.channel) {
      console.log('📡 [RealtimeService] Cleaning up subscriptions...');
      supabase.removeChannel(this.channel);
      this.channel = null;
      this.queryClient = null;
    }
  }
}

export const realtimeService = new RealtimeService();