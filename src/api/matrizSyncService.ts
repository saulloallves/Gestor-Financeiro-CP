import { supabase } from './supabaseClient';
import { supabaseMatriz } from './supabaseMatrizClient';
import { mapearFranqueadoMatriz, mapearUnidadeMatriz } from '../utils/matrizMappers';
import type { 
  FranqueadoMapeado, 
  UnidadeMapeada,
  UnidadeMatriz,
  VFranqueadosUnidadesDetalhes
} from '../types/matriz';

const BATCH_SIZE = 500; // Processar em lotes para não sobrecarregar

export interface SyncStats {
  unidades: { total: number; synced: number };
  franqueados: { total: number; synced: number };
  franqueadosUnidades: { total: number; synced: number };
}

class MatrizSyncService {
  private async fetchAllMatrizData<T>(tableName: string): Promise<T[]> {
    let allData: T[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabaseMatriz
        .from(tableName)
        .select('*')
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
      unidades: { total: 0, synced: 0 },
      franqueados: { total: 0, synced: 0 },
      franqueadosUnidades: { total: 0, synced: 0 },
    };

    try {
      // 1. Sincronizar Unidades
      onProgress(stats, 'Buscando unidades da matriz...');
      const unidadesMatriz = await this.fetchAllMatrizData<UnidadeMatriz>('unidades');
      stats.unidades.total = unidadesMatriz.length;
      onProgress(stats, `Encontradas ${stats.unidades.total} unidades. Mapeando...`);

      const unidadesMapeadas: UnidadeMapeada[] = unidadesMatriz.map(mapearUnidadeMatriz);
      onProgress(stats, `Sincronizando ${stats.unidades.total} unidades com o banco local...`);

      const { error: unidadesError } = await supabase
        .from('unidades')
        .upsert(unidadesMapeadas, { onConflict: 'id' });

      if (unidadesError) throw new Error(`Erro ao sincronizar unidades: ${unidadesError.message}`);
      stats.unidades.synced = unidadesMapeadas.length;
      onProgress(stats, 'Unidades sincronizadas com sucesso!');

      // 2. Sincronizar Franqueados
      onProgress(stats, 'Buscando franqueados da matriz...');
      const franqueadosMatriz = await this.fetchAllMatrizData<VFranqueadosUnidadesDetalhes>('v_franqueados_unidades_detalhes');
      stats.franqueados.total = franqueadosMatriz.length;
      onProgress(stats, `Encontrados ${stats.franqueados.total} franqueados. Mapeando...`);

      const franqueadosMapeados: FranqueadoMapeado[] = franqueadosMatriz.map(mapearFranqueadoMatriz);
      onProgress(stats, `Sincronizando ${stats.franqueados.total} franqueados com o banco local...`);

      const { error: franqueadosError } = await supabase
        .from('franqueados')
        .upsert(franqueadosMapeados, { onConflict: 'id' });

      if (franqueadosError) throw new Error(`Erro ao sincronizar franqueados: ${franqueadosError.message}`);
      stats.franqueados.synced = franqueadosMapeados.length;
      onProgress(stats, 'Franqueados sincronizados com sucesso!');

      // 3. Sincronizar Vínculos (Franqueados <-> Unidades)
      onProgress(stats, 'Buscando vínculos da matriz...');
      const vinculosMatriz = await this.fetchAllMatrizData('franqueados_unidades');
      stats.franqueadosUnidades.total = vinculosMatriz.length;
      onProgress(stats, `Encontrados ${stats.franqueadosUnidades.total} vínculos. Sincronizando...`);

      // O upsert usa o par (franqueado_id, unidade_id) para evitar duplicatas
      const { error: vinculosError } = await supabase
        .from('franqueados_unidades')
        .upsert(vinculosMatriz, { onConflict: 'franqueado_id,unidade_id' });

      if (vinculosError) throw new Error(`Erro ao sincronizar vínculos: ${vinculosError.message}`);
      stats.franqueadosUnidades.synced = vinculosMatriz.length;
      onProgress(stats, 'Sincronização concluída!');

      return stats;
    } catch (error) {
      console.error('Erro na sincronização da matriz:', error);
      throw error;
    }
  }
}

export const matrizSyncService = new MatrizSyncService();