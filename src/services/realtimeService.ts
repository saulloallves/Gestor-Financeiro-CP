import { supabase } from '../api/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';
import { useDataStore } from '../store/dataStore';
import toast from 'react-hot-toast';

class RealtimeService {
  private matrizChannel: RealtimeChannel | null = null;
  private cobrancasChannel: RealtimeChannel | null = null; // NOVO CANAL
  private queryClient: QueryClient | null = null;

  public initialize(queryClient: QueryClient) {
    if (this.matrizChannel || this.cobrancasChannel) {
      console.log('📡 [RealtimeService] Already initialized.');
      return;
    }
    
    this.queryClient = queryClient;
    console.log('📡 [RealtimeService] Initializing subscriptions...');

    // Canal para atualizações da Matriz (unidades, franqueados)
    this.matrizChannel = supabase.channel('matriz-updates');
    this.matrizChannel
      .on('broadcast', { event: 'db-change' }, ({ payload }) => {
        console.log('📡 [Realtime] Matriz update received:', payload);
        
        if (payload.table === 'unidades') {
          this.queryClient?.invalidateQueries({ queryKey: ['unidades'] });
          useDataStore.getState().refreshData();
          toast.success(`Unidade atualizada em tempo real!`);
        } else if (payload.table === 'franqueados') {
          this.queryClient?.invalidateQueries({ queryKey: ['franqueados'] });
          useDataStore.getState().refreshData();
          toast.success(`Franqueado atualizado em tempo real!`);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RealtimeService] Subscribed to matriz-updates channel!');
        }
      });

    // NOVO CANAL: Específico para atualizações de cobranças via webhook
    this.cobrancasChannel = supabase.channel('cobrancas-updates');
    this.cobrancasChannel
      .on('broadcast', { event: 'cobranca-updated' }, ({ payload }) => {
        console.log('📡 [Realtime] Cobrança update received via webhook:', payload);
        
        // Força a atualização do cache de dados
        useDataStore.getState().refreshData();
        
        // Exibe uma notificação mais informativa
        toast.success(`Cobrança da unidade ${payload.codigo_unidade} foi atualizada!`, {
          icon: '🔄',
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RealtimeService] Subscribed to cobrancas-updates channel!');
        }
      });
  }

  public cleanup() {
    console.log('📡 [RealtimeService] Cleaning up subscriptions...');
    if (this.matrizChannel) {
      supabase.removeChannel(this.matrizChannel);
      this.matrizChannel = null;
    }
    if (this.cobrancasChannel) {
      supabase.removeChannel(this.cobrancasChannel);
      this.cobrancasChannel = null;
    }
    this.queryClient = null;
  }
}

export const realtimeService = new RealtimeService();