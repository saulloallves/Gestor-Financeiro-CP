import { supabase } from '../api/supabaseClient';
import { useDataStore } from '../store/dataStore';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Cobranca } from '../types/cobrancas';

class RealtimeService {
  private cobrancasChannel: RealtimeChannel | null = null;

  /**
   * Inicia as assinaturas para as tabelas do banco de dados local.
   */
  public initializeLocalSubscriptions() {
    console.log('📡 [RealtimeService] Initializing local subscriptions...');
    this.subscribeToCobrancas();
  }

  /**
   * Inscreve-se para receber atualizações em tempo real da tabela 'cobrancas'.
   */
  private subscribeToCobrancas() {
    // Evita múltiplas inscrições
    if (this.cobrancasChannel) {
      console.log('📡 [RealtimeService] Already subscribed to cobrancas. Skipping.');
      return;
    }

    const channel = supabase.channel('public:cobrancas');

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cobrancas' },
        (payload) => {
          console.log('📡 [Realtime] INSERT received for cobrancas:', payload.new);
          const newCobranca = payload.new as Cobranca;
          // Adiciona a nova cobrança ao cache
          useDataStore.getState().addCobranca(newCobranca);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cobrancas' },
        (payload) => {
          console.log('📡 [Realtime] UPDATE received for cobrancas:', payload.new);
          const updatedCobranca = payload.new as Cobranca;
          // Atualiza a cobrança existente no cache
          useDataStore.getState().updateCobranca(updatedCobranca);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cobrancas' },
        (payload) => {
          console.log('📡 [Realtime] DELETE received for cobrancas:', payload.old);
          const deletedCobrancaId = payload.old.id as string;
          // Remove a cobrança do cache
          useDataStore.getState().removeCobranca(deletedCobrancaId);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RealtimeService] Successfully subscribed to cobrancas channel!');
        } else {
          console.warn(`[RealtimeService] Cobrancas channel status: ${status}`);
        }
      });

    this.cobrancasChannel = channel;
  }

  /**
   * Limpa todas as assinaturas ativas para evitar memory leaks.
   */
  public cleanupSubscriptions() {
    console.log('📡 [RealtimeService] Cleaning up subscriptions...');
    if (this.cobrancasChannel) {
      supabase.removeChannel(this.cobrancasChannel);
      this.cobrancasChannel = null;
      console.log('📡 [RealtimeService] Unsubscribed from cobrancas channel.');
    }
  }
}

export const realtimeService = new RealtimeService();