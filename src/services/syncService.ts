import { supabase } from '../api/supabaseClient';
import { cobrancasService } from '../api/cobrancasService';
import { franqueadosService } from '../api/franqueadosService';
import { unidadesService } from '../api/unidadesService';
import { UsuariosInternosService } from '../api/usuariosInternosService';
import { comunicacoesService } from '../api/comunicacoesService';
import type { Cobranca } from '../types/cobrancas';
import type { Franqueado, FranqueadoUnidade } from '../types/franqueados';
import type { Unidade } from '../types/unidades';
import type { UsuarioInterno } from '../types/auth';
import type { Comunicacao } from '../types/comunicacao';

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
  comunicacoes: Comunicacao[];
  franqueadosUnidades: FranqueadoUnidade[];
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
    comunicacoes: number;
    franqueadosUnidades: number;
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
    comunicacoes: number;
    franqueadosUnidades: number;
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
    const totalSteps = 6;
    
    try {
      this.updateProgress(0, totalSteps, 'Preparando sincronização...');

      this.updateProgress(1, totalSteps, 'Sincronizando franqueados...');
      const franqueados = await this.syncFranqueados();

      this.updateProgress(2, totalSteps, 'Sincronizando unidades...');
      const unidades = await this.syncUnidades();

      this.updateProgress(3, totalSteps, 'Sincronizando vínculos...');
      const franqueadosUnidades = await this.syncFranqueadosUnidades();

      this.updateProgress(4, totalSteps, 'Sincronizando cobranças...');
      const cobrancas = await this.syncCobrancas();

      this.updateProgress(5, totalSteps, 'Sincronizando usuários...');
      const usuariosInternos = await this.syncUsuariosInternos();

      this.updateProgress(6, totalSteps, 'Sincronizando comunicações...');
      const comunicacoes = await this.syncComunicacoes();

      const syncTime = Date.now() - startTime;
      this.updateProgress(totalSteps, totalSteps, 'Sincronização concluída!');

      return {
        success: true,
        data: {
          franqueados,
          cobrancas,
          unidades,
          usuariosInternos,
          comunicacoes,
          franqueadosUnidades,
        },
        stats: {
          franqueados: franqueados.length,
          cobrancas: cobrancas.length,
          unidades: unidades.length,
          usuariosInternos: usuariosInternos.length,
          comunicacoes: comunicacoes.length,
          franqueadosUnidades: franqueadosUnidades.length,
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
      const response = await franqueadosService.getFranqueados({}, { field: "nome", direction: "asc" }, { page: 1, limit: 2000 });
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao sincronizar franqueados:', error);
      return [];
    }
  }

  private async syncUnidades(): Promise<Unidade[]> {
    try {
      const response = await unidadesService.getUnidades({}, { field: "codigo_unidade", direction: "asc" }, { page: 1, limit: 2000 });
      return response.data || [];
    } catch (error) {
      console.error('❌ Erro ao sincronizar unidades:', error);
      return [];
    }
  }

  private async syncFranqueadosUnidades(): Promise<FranqueadoUnidade[]> {
    try {
      const { data, error } = await supabase.from('franqueados_unidades').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao sincronizar vínculos:', error);
      return [];
    }
  }

  private async syncCobrancas(): Promise<Cobranca[]> {
    try {
      return await cobrancasService.listarCobrancas() || [];
    } catch (error) {
      console.error('Erro ao sincronizar cobranças:', error);
      return [];
    }
  }

  private async syncUsuariosInternos(): Promise<UsuarioInterno[]> {
    try {
      return await UsuariosInternosService.buscarUsuarios() || [];
    } catch (error) {
      console.error('Erro ao sincronizar usuários internos:', error);
      return [];
    }
  }

  private async syncComunicacoes(): Promise<Comunicacao[]> {
    try {
      return await comunicacoesService.getLogs() || [];
    } catch (error) {
      console.error('Erro ao sincronizar comunicações:', error);
      return [];
    }
  }

  async syncIncremental(lastSyncAt: Date): Promise<IncrementalSyncResult> {
    const startTime = Date.now();
    const totalSteps = 6;
    
    try {
      this.updateProgress(0, totalSteps, 'Verificando atualizações...');
      const lastSyncString = lastSyncAt.toISOString();

      const [franqueados, unidades, franqueadosUnidades, cobrancas, usuariosInternos, comunicacoes] = await Promise.all([
        franqueadosService.getFranqueados({ updated_at_gte: lastSyncString }, { field: 'updated_at', direction: 'asc' }, { page: 1, limit: 5000 }).then(r => r.data),
        unidadesService.getUnidades({ updated_at_gte: lastSyncString }, { field: 'updated_at', direction: 'asc' }, { page: 1, limit: 5000 }).then(r => r.data),
        supabase.from('franqueados_unidades').select('*').gte('updated_at', lastSyncString).then(r => r.data || []),
        cobrancasService.listarCobrancas({ updated_at_gte: lastSyncString }),
        UsuariosInternosService.buscarUsuarios({ updated_at_gte: lastSyncString }),
        comunicacoesService.getLogs({ data_envio_gte: lastSyncString }),
      ]);

      this.updateProgress(totalSteps, totalSteps, 'Finalizado!');
      const syncTime = Date.now() - startTime;

      return {
        success: true,
        updates: {
          franqueados,
          unidades,
          franqueadosUnidades,
          cobrancas,
          usuariosInternos,
          comunicacoes,
        },
        stats: {
          franqueados: franqueados.length,
          unidades: unidades.length,
          franqueadosUnidades: franqueadosUnidades.length,
          cobrancas: cobrancas.length,
          usuariosInternos: usuariosInternos.length,
          comunicacoes: comunicacoes.length,
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
}

export const syncService = new SyncService();