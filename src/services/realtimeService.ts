import { supabase } from '../api/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { QueryClient } from '@tanstack/react-query';

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
          console.log('🔄 [Realtime] Unidades query cache invalidated.');
        } else if (payload.table === 'franqueados') {
          this.queryClient?.invalidateQueries({ queryKey: ['franqueados'] });
          console.log('🔄 [Realtime] Franqueados query cache invalidated.');
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RealtimeService] Subscribed to matriz-updates channel!');
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