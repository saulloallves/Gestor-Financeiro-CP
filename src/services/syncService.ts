import { supabase } from '../api/supabaseClient';
import { cobrancasService } from '../api/cobrancasService';
import { franqueadosService } from '../api/franqueadosService';
import { unidadesService } from '../api/unidadesService';
import { UsuariosInternosService } from '../api/usuariosInternosService';
import type { Cobranca } from '../types/cobrancas';
import type { Franqueado } from '../types/franqueados';
import type { Unidade } from '../types/unidades';
import type { UsuarioInterno } from '../types/auth';

export interface SyncProgress {
  current: number;
  total: number;
  stage: string;
}

export interface SyncData {
  franqueados: Franqueado[];
  cobrancas: Cobranca[];
  unidades: Unidade[];
  usuariosInternos: UsuarioInterno[];
}

export interface SyncResult {
  success: boolean;
  error?: string;
  data?: SyncData;
  stats?: {
    franqueados: number;
    cobrancas: number;
    unidades: number;
    usuariosInternos: number;
    syncTime: number;
  };
}

export interface IncrementalSyncResult {
  success: boolean;
  error?: string;
  updates?: Partial<SyncData>;
  stats?: {
    franqueados: number;
    cobrancas: number;
    unidades: number;
    usuariosInternos: number;
    syncTime: number;
  };
}

class SyncService {
  private onProgress?: (progress: SyncProgress) => void;

  setProgressCallback(callback: (progress: SyncProgress) => void) {
    this.onProgress = callback;
  }

  private updateProgress(current: number, total: number, stage: string) {
    if (this.onProgress) {
      this.onProgress({ current, total, stage });
    }
  }

  async syncAllData(): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      this.updateProgress(0, 4, 'Preparando sincronização...');

      // Fase 1: Sincronizar dados do banco matriz (franqueados)
      this.updateProgress(1, 4, 'Sincronizando franqueados...');
      const franqueados = await this.syncFranqueados();

      // Fase 2: Sincronizar dados do banco matriz (unidades)
      this.updateProgress(2, 4, 'Sincronizando unidades...');
      const unidades = await this.syncUnidades();

      // Fase 3: Sincronizar dados locais (cobranças)
      this.updateProgress(3, 4, 'Sincronizando cobranças...');
      const cobrancas = await this.syncCobrancas();

      // Fase 4: Sincronizar usuários internos
      this.updateProgress(4, 4, 'Sincronizando usuários...');
      const usuariosInternos = await this.syncUsuariosInternos();

      const syncTime = Date.now() - startTime;

      this.updateProgress(4, 4, 'Sincronização concluída!');

      return {
        success: true,
        data: {
          franqueados,
          cobrancas,
          unidades,
          usuariosInternos,
        },
        stats: {
          franqueados: franqueados.length,
          cobrancas: cobrancas.length,
          unidades: unidades.length,
          usuariosInternos: usuariosInternos.length,
          syncTime,
        },
      };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na sincronização',
      };
    }
  }

  private async syncFranqueados(): Promise<Franqueado[]> {
    try {
      console.log('Sincronizando franqueados do banco matriz...');
      
      // Buscar todos os franqueados do banco matriz com limite alto para não paginar
      const response = await franqueadosService.getFranqueados({}, 
        { field: "nome", direction: "asc" },
        { page: 1, limit: 1000 }
      );
      
      console.log('📊 Resposta do franqueadosService:', {
        dataLength: response.data?.length || 0,
        hasData: !!response.data
      });
      
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao sincronizar franqueados:', error);
      
      // Em caso de erro, tentar buscar do banco local
      try {
        const { data: localFranqueados } = await supabase
          .from('franqueados')
          .select('*')
          .order('created_at', { ascending: false });
        
        return localFranqueados || [];
      } catch (localError) {
        console.error('Erro ao buscar franqueados locais:', localError);
        return [];
      }
    }
  }

  private async syncUnidades(): Promise<Unidade[]> {
    try {
      console.log('Sincronizando unidades do banco matriz...');
      
      // Buscar todas as unidades do banco matriz com limite alto para não paginar
      const response = await unidadesService.getUnidades({}, 
        { field: "codigo_unidade", direction: "asc" },
        { page: 1, limit: 1000 }
      );
      
      console.log('📊 Resposta do unidadesService:', {
        dataLength: response.data?.length || 0,
        hasData: !!response.data
      });
      
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao sincronizar unidades:', error);
      return [];
    }
  }

  private async syncCobrancas(): Promise<Cobranca[]> {
    try {
      const cobrancas = await cobrancasService.listarCobrancas();
      return cobrancas || [];
    } catch (error) {
      console.error('Erro ao sincronizar cobranças:', error);
      return [];
    }
  }

  private async syncUsuariosInternos(): Promise<UsuarioInterno[]> {
    try {
      const usuarios = await UsuariosInternosService.buscarUsuarios();
      return usuarios || [];
    } catch (error) {
      console.error('Erro ao sincronizar usuários internos:', error);
      return [];
    }
  }

  async syncIncremental(lastSyncAt: Date): Promise<IncrementalSyncResult> {
    const startTime = Date.now();
    
    try {
      this.updateProgress(0, 4, 'Verificando atualizações...');
      const lastSyncString = lastSyncAt.toISOString();

      const [franqueados, unidades, cobrancas, usuariosInternos] = await Promise.all([
        franqueadosService.getFranqueados({ updated_at_gte: lastSyncString }, { field: 'updated_at', direction: 'asc' }, { page: 1, limit: 5000 }).then(r => r.data),
        unidadesService.getUnidades({ updated_at_gte: lastSyncString }, { field: 'updated_at', direction: 'asc' }, { page: 1, limit: 5000 }).then(r => r.data),
        cobrancasService.listarCobrancas({ updated_at_gte: lastSyncString }),
        UsuariosInternosService.buscarUsuarios({ updated_at_gte: lastSyncString }),
      ]);

      this.updateProgress(4, 4, 'Finalizado!');
      const syncTime = Date.now() - startTime;

      return {
        success: true,
        updates: {
          franqueados,
          unidades,
          cobrancas,
          usuariosInternos,
        },
        stats: {
          franqueados: franqueados.length,
          unidades: unidades.length,
          cobrancas: cobrancas.length,
          usuariosInternos: usuariosInternos.length,
          syncTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na sincronização incremental',
      };
    }
  }

  async testMatrizConnection(): Promise<boolean> {
    try {
      // TODO: Implementar teste de conexão com banco matriz
      console.log('Testando conexão com banco matriz...');
      
      // Por enquanto, sempre retorna false pois não temos matriz implementado
      return false;
    } catch (error) {
      console.error('Erro ao testar conexão matriz:', error);
      return false;
    }
  }
}

export const syncService = new SyncService();