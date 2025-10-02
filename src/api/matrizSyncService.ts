import { supabase } from './supabaseClient';
import { supabaseMatriz } from './supabaseMatrizClient';
import { mapearFranqueadoMatriz, mapearUnidadeMatriz } from '../utils/matrizMappers';
import type { 
  FranqueadoMapeado, 
  UnidadeMapeada,
  UnidadeMatriz,
  VFranqueadosUnidadesDetalhes
} from '../types/matriz';
import { publishEvent } from './eventService';

const BATCH_SIZE = 500;

export interface SyncStats {
  unidades: { total: number; synced: number; deleted: number };
  franqueados: { total: number; synced: number; deleted: number };
  franqueadosUnidades: { total: number; synced: number; deleted: number };
}

class MatrizSyncService {
  private async fetchAllMatrizData<T>(tableName: string, columns: string = '*'): Promise<T[]> {
    let allData: T[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseMatriz
        .from(tableName)
        .select(columns)
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        throw new Error(`Erro ao buscar dados da matriz (${tableName}): ${error.message}`);
      }

      if (data) {
        allData = [...allData, ...data];
      }

      hasMore = data.length === BATCH_SIZE;
      offset += BATCH_SIZE;
    }
    return allData;
  }

  // Nova função para buscar unidades via RPC, bypassando RLS
  private async fetchAllUnidadesFromMatrizRpc(): Promise<UnidadeMatriz[]> {
    const { data, error } = await supabaseMatriz.rpc('get_all_unidades_for_sync');
    if (error) {
      throw new Error(`Erro ao buscar unidades via RPC: ${error.message}`);
    }
    return data || [];
  }

  async syncAllMatrizData(
    onProgress: (stats: SyncStats, message: string) => void
  ): Promise<SyncStats> {
    const stats: SyncStats = {
      unidades: { total: 0, synced: 0, deleted: 0 },
      franqueados: { total: 0, synced: 0, deleted: 0 },
      franqueadosUnidades: { total: 0, synced: 0, deleted: 0 },
    };

    try {
      // --- FASE 1: BUSCAR TODOS OS DADOS DA MATRIZ ---
      onProgress(stats, 'Buscando todos os dados da matriz...');
      const [unidadesMatriz, franqueadosMatriz, vinculosMatriz] = await Promise.all([
        this.fetchAllUnidadesFromMatrizRpc(), // Usando a nova função RPC
        this.fetchAllMatrizData<VFranqueadosUnidadesDetalhes>('v_franqueados_unidades_detalhes'),
        this.fetchAllMatrizData('franqueados_unidades'),
      ]);
      stats.unidades.total = unidadesMatriz.length;
      stats.franqueados.total = franqueadosMatriz.length;
      stats.franqueadosUnidades.total = vinculosMatriz.length;
      onProgress(stats, 'Dados da matriz carregados. Iniciando limpeza local...');

      // --- FASE 2: LIMPEZA COMPLETA DO BANCO LOCAL (ORDEM INVERSA DE DEPENDÊNCIA) ---
      onProgress(stats, 'Limpando vínculos antigos...');
      const { error: deleteVinculosError } = await supabase.from('franqueados_unidades').delete().not('id', 'is', null);
      if (deleteVinculosError) throw new Error(`Erro ao limpar vínculos: ${deleteVinculosError.message}`);

      onProgress(stats, 'Limpando franqueados antigos...');
      const { error: deleteFranqueadosError } = await supabase.from('franqueados').delete().not('id', 'is', null);
      if (deleteFranqueadosError) throw new Error(`Erro ao limpar franqueados: ${deleteFranqueadosError.message}`);

      onProgress(stats, 'Limpando unidades antigas...');
      const { error: deleteUnidadesError } = await supabase.from('unidades').delete().not('id', 'is', null);
      if (deleteUnidadesError) throw new Error(`Erro ao limpar unidades: ${deleteUnidadesError.message}`);
      onProgress(stats, 'Limpeza local concluída. Iniciando inserção de dados...');

      // --- FASE 3: INSERÇÃO DOS NOVOS DADOS (ORDEM DE DEPENDÊNCIA) ---
      onProgress(stats, `Sincronizando ${unidadesMatriz.length} unidades...`);
      const unidadesMapeadas: UnidadeMapeada[] = unidadesMatriz.map(mapearUnidadeMatriz);
      if (unidadesMapeadas.length > 0) {
        const { error: unidadesError } = await supabase.from('unidades').upsert(unidadesMapeadas, { onConflict: 'id' });
        if (unidadesError) throw new Error(`Erro ao sincronizar unidades: ${unidadesError.message}`);
      }
      stats.unidades.synced = unidadesMapeadas.length;

      onProgress(stats, `Sincronizando ${franqueadosMatriz.length} franqueados...`);
      const franqueadosMapeados: FranqueadoMapeado[] = franqueadosMatriz.map(mapearFranqueadoMatriz);
      if (franqueadosMapeados.length > 0) {
        const { error: franqueadosError } = await supabase.from('franqueados').upsert(franqueadosMapeados, { onConflict: 'id' });
        if (franqueadosError) throw new Error(`Erro ao sincronizar franqueados: ${franqueadosError.message}`);
      }
      stats.franqueados.synced = franqueadosMapeados.length;

      onProgress(stats, `Sincronizando ${vinculosMatriz.length} vínculos...`);
      const unidadesMatrizIds = new Set(unidadesMatriz.map(u => u.id));
      const franqueadosMatrizIds = new Set(franqueadosMatriz.map(f => f.id));
      const vinculosValidos = vinculosMatriz.filter(vinculo => 
        unidadesMatrizIds.has(vinculo.unidade_id) && franqueadosMatrizIds.has(vinculo.franqueado_id)
      );
      if (vinculosValidos.length > 0) {
        const { error: vinculosError } = await supabase.from('franqueados_unidades').upsert(vinculosValidos, { onConflict: 'id' });
        if (vinculosError) throw new Error(`Erro ao sincronizar vínculos: ${vinculosError.message}`);
      }
      stats.franqueadosUnidades.synced = vinculosValidos.length;
      onProgress(stats, 'Sincronização concluída!');

      try {
        await publishEvent({
          topic: 'system.sync.completed',
          payload: { status: 'success', synced_at: new Date().toISOString(), stats },
        });
      } catch (eventError) {
        console.warn('Falha ao publicar evento de sucesso da sincronização:', eventError);
      }

      return stats;
    } catch (error) {
      console.error('Erro na sincronização da matriz:', error);
      try {
        await publishEvent({
          topic: 'system.sync.failed',
          payload: { status: 'error', failed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : 'Erro desconhecido' },
        });
      } catch (eventError) {
        console.warn('Falha ao publicar evento de erro da sincronização:', eventError);
      }
      throw error;
    }
  }
}

export const matrizSyncService = new MatrizSyncService();