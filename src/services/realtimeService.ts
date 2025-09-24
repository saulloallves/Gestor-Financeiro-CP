import { supabase } from '../api/supabaseClient';
import { useDataStore } from '../store/dataStore';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Cobranca } from '../types/cobrancas';
import type { Unidade } from '../types/unidades';
import type { Franqueado } from '../types/franqueados';
import { mapearUnidadeMatriz, mapearFranqueadoMatriz } from '../utils/matrizMappers';

class RealtimeService {
  private cobrancasChannel: RealtimeChannel | null = null;
  private matrizChannel: RealtimeChannel | null = null;

  /**
   * Inicia todas as assinaturas de canais.
   */
  public initializeSubscriptions() {
    console.log('📡 [RealtimeService] Initializing all subscriptions...');
    this.subscribeToCobrancas();
    this.subscribeToMatrizUpdates();
  }

  /**
   * Inscreve-se para receber atualizações da tabela 'cobrancas'.
   */
  private subscribeToCobrancas() {
    if (this.cobrancasChannel) return;

    const channel = supabase.channel('public:cobrancas');
    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cobrancas' },
        (payload) => {
          console.log('📡 [Realtime] INSERT cobrancas:', payload.new);
          useDataStore.getState().addCobranca(payload.new as Cobranca);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cobrancas' },
        (payload) => {
          console.log('📡 [Realtime] UPDATE cobrancas:', payload.new);
          useDataStore.getState().updateCobranca(payload.new as Cobranca);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cobrancas' },
        (payload) => {
          console.log('📡 [Realtime] DELETE cobrancas:', payload.old);
          useDataStore.getState().removeCobranca(payload.old.id as string);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RealtimeService] Subscribed to cobrancas channel!');
        }
      });
    this.cobrancasChannel = channel;
  }

  /**
   * Inscreve-se para receber atualizações do banco de dados Matriz.
   */
  private subscribeToMatrizUpdates() {
    if (this.matrizChannel) return;

    const channel = supabase.channel('matriz-updates');
    channel
      .on('broadcast', { event: 'matriz-update' }, ({ payload }) => {
        console.log('📡 [Realtime] Matriz update received:', payload);
        
        const { type, record } = payload;
        if (type === 'unidades') {
          const unidadeMapeada = mapearUnidadeMatriz(record) as unknown as Unidade;
          useDataStore.getState().addOrUpdateUnidade(unidadeMapeada);
        } else if (type === 'franqueados') {
          const franqueadoMapeado = mapearFranqueadoMatriz(record) as unknown as Franqueado;
          useDataStore.getState().addOrUpdateFranqueado(franqueadoMapeado);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [RealtimeService] Subscribed to matriz-updates channel!');
        }
      });
    this.matrizChannel = channel;
  }

  /**
   * Limpa todas as assinaturas ativas.
   */
  public cleanupSubscriptions() {
    console.log('📡 [RealtimeService] Cleaning up subscriptions...');
    if (this.cobrancasChannel) {
      supabase.removeChannel(this.cobrancasChannel);
      this.cobrancasChannel = null;
    }
    if (this.matrizChannel) {
      supabase.removeChannel(this.matrizChannel);
      this.matrizChannel = null;
    }
  }
}

export const realtimeService = new RealtimeService();