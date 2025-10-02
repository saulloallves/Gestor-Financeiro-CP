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

  async syncAllMatrizData(
    onProgress: (stats: SyncStats, message: string) => void
  ): Promise<SyncStats> {
    const stats: SyncStats = {
      unidades: { total: 0, synced: 0, deleted: 0 },
      franqueados: { total: 0, synced: 0, deleted: 0 },
      franqueadosUnidades: { total: 0, synced: 0, deleted: 0 },
    };

    try {
      // --- SINCRONIZAÇÃO DE UNIDADES ---
      onProgress(stats, 'Buscando unidades da matriz...');
      const unidadesMatriz = await this.fetchAllMatrizData<UnidadeMatriz>('unidades');
      stats.unidades.total = unidadesMatriz.length;
      const unidadesMatrizIds = new Set(unidadesMatriz.map(u => u.id));

      onProgress(stats, `Limpando unidades órfãs...`);
      const { data: localUnidadesIds } = await supabase.from('unidades').select('id');
      const unidadesIdsToDelete = localUnidadesIds?.filter(u => !unidadesMatrizIds.has(u.id)).map(u => u.id) || [];
      if (unidadesIdsToDelete.length > 0) {
        await supabase.from('franqueados_unidades').delete().in('unidade_id', unidadesIdsToDelete);
        const { error: deleteError } = await supabase.from('unidades').delete().in('id', unidadesIdsToDelete);
        if (deleteError) throw new Error(`Erro ao deletar unidades órfãs: ${deleteError.message}`);
        stats.unidades.deleted = unidadesIdsToDelete.length;
      }
      onProgress(stats, `${stats.unidades.deleted} unidades órfãs removidas. Sincronizando...`);
      const unidadesMapeadas: UnidadeMapeada[] = unidadesMatriz.map(mapearUnidadeMatriz);
      const { error: unidadesError } = await supabase.from('unidades').upsert(unidadesMapeadas, { onConflict: 'id' });
      if (unidadesError) throw new Error(`Erro ao sincronizar unidades: ${unidadesError.message}`);
      stats.unidades.synced = unidadesMapeadas.length;
      onProgress(stats, 'Unidades sincronizadas com sucesso!');

      // --- SINCRONIZAÇÃO DE FRANQUEADOS ---
      onProgress(stats, 'Buscando franqueados da matriz...');
      const franqueadosMatriz = await this.fetchAllMatrizData<VFranqueadosUnidadesDetalhes>('v_franqueados_unidades_detalhes');
      stats.franqueados.total = franqueadosMatriz.length;
      const franqueadosMatrizIds = new Set(franqueadosMatriz.map(f => f.id));

      onProgress(stats, `Limpando franqueados órfãos...`);
      const { data: localFranqueadosIds } = await supabase.from('franqueados').select('id');
      const franqueadosIdsToDelete = localFranqueadosIds?.filter(f => !franqueadosMatrizIds.has(f.id)).map(f => f.id) || [];
      if (franqueadosIdsToDelete.length > 0) {
        await supabase.from('franqueados_unidades').delete().in('franqueado_id', franqueadosIdsToDelete);
        const { error: deleteError } = await supabase.from('franqueados').delete().in('id', franqueadosIdsToDelete);
        if (deleteError) throw new Error(`Erro ao deletar franqueados órfãos: ${deleteError.message}`);
        stats.franqueados.deleted = franqueadosIdsToDelete.length;
      }
      onProgress(stats, `${stats.franqueados.deleted} franqueados órfãos removidos. Sincronizando...`);
      const franqueadosMapeados: FranqueadoMapeado[] = franqueadosMatriz.map(mapearFranqueadoMatriz);
      const { error: franqueadosError } = await supabase.from('franqueados').upsert(franqueadosMapeados, { onConflict: 'id' });
      if (franqueadosError) throw new Error(`Erro ao sincronizar franqueados: ${franqueadosError.message}`);
      stats.franqueados.synced = franqueadosMapeados.length;
      onProgress(stats, 'Franqueados sincronizados com sucesso!');

      // --- SINCRONIZAÇÃO DE VÍNCULOS ---
      onProgress(stats, 'Buscando vínculos da matriz...');
      const vinculosMatriz = await this.fetchAllMatrizData('franqueados_unidades');
      stats.franqueadosUnidades.total = vinculosMatriz.length;

      // **CORREÇÃO:** Filtrar vínculos para garantir que tanto o franqueado quanto a unidade existem localmente
      const vinculosValidos = vinculosMatriz.filter(vinculo => 
        unidadesMatrizIds.has(vinculo.unidade_id) && franqueadosMatrizIds.has(vinculo.franqueado_id)
      );
      const vinculosIgnorados = vinculosMatriz.length - vinculosValidos.length;
      if (vinculosIgnorados > 0) {
        console.warn(`[Sync] Ignorando ${vinculosIgnorados} vínculos quebrados da matriz.`);
      }

      onProgress(stats, `Limpando todos os vínculos locais...`);
      const { error: deleteVinculosError } = await supabase.from('franqueados_unidades').delete().neq('id', 0); // Deleta tudo
      if (deleteVinculosError) throw new Error(`Erro ao limpar vínculos: ${deleteVinculosError.message}`);
      stats.franqueadosUnidades.deleted = stats.franqueadosUnidades.total; // Assumindo que todos são substituídos
      
      onProgress(stats, `Sincronizando ${vinculosValidos.length} vínculos válidos...`);
      if (vinculosValidos.length > 0) {
        const { error: vinculosError } = await supabase.from('franqueados_unidades').upsert(vinculosValidos, { onConflict: 'id' });
        if (vinculosError) throw new Error(`Erro ao sincronizar vínculos: ${vinculosError.message}`);
      }
      stats.franqueadosUnidades.synced = vinculosValidos.length;
      onProgress(stats, 'Sincronização concluída!');

      await publishEvent({
        topic: 'system.sync.completed',
        payload: { status: 'success', synced_at: new Date().toISOString(), stats },
      });

      return stats;
    } catch (error) {
      console.error('Erro na sincronização da matriz:', error);
      await publishEvent({
        topic: 'system.sync.failed',
        payload: { status: 'error', failed_at: new Date().toISOString(), error_message: error instanceof Error ? error.message : 'Erro desconhecido' },
      });
      throw error;
    }
  }
}

export const matrizSyncService = new MatrizSyncService();