import { supabase } from '../api/supabaseClient';
import { cobrancasService } from '../api/cobrancasService';
import { franqueadosService } from '../api/franqueadosService';
import { UsuariosInternosService } from '../api/usuariosInternosService';
import type { Cobranca } from '../types/cobrancas';
import type { Franqueado } from '../types/franqueados';
import type { UsuarioInterno } from '../types/auth';

export interface SyncProgress {
  current: number;
  total: number;
  stage: string;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  data?: {
    franqueados: Franqueado[];
    cobrancas: Cobranca[];
    usuariosInternos: UsuarioInterno[];
  };
  stats?: {
    franqueados: number;
    cobrancas: number;
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
      this.updateProgress(0, 3, 'Preparando sincronização...');

      // Fase 1: Sincronizar dados do banco matriz (franqueados)
      this.updateProgress(1, 3, 'Sincronizando franqueados...');
      const franqueados = await this.syncFranqueados();

      // Fase 2: Sincronizar dados locais (cobranças)
      this.updateProgress(2, 3, 'Sincronizando cobranças...');
      const cobrancas = await this.syncCobrancas();

      // Fase 3: Sincronizar usuários internos
      this.updateProgress(3, 3, 'Sincronizando usuários...');
      const usuariosInternos = await this.syncUsuariosInternos();

      const syncTime = Date.now() - startTime;

      this.updateProgress(3, 3, 'Sincronização concluída!');

      return {
        success: true,
        data: {
          franqueados,
          cobrancas,
          usuariosInternos,
        },
        stats: {
          franqueados: franqueados.length,
          cobrancas: cobrancas.length,
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
      // TODO: Quando implementarmos o banco matriz, usar método getFranqueados
      console.log('Tentando sincronizar do banco matriz...');
      
      // Fallback para dados locais se matriz não disponível
      const response = await franqueadosService.getFranqueados();
      return response.data || [];
    } catch (error) {
      console.warn('Erro ao sincronizar franqueados, usando dados locais:', error);
      
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

  async syncIncremental(lastSyncAt: Date): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      this.updateProgress(0, 3, 'Verificando atualizações...');

      // Buscar apenas dados atualizados desde a última sincronização
      const franqueados = await this.syncFranqueadosIncremental(lastSyncAt);
      this.updateProgress(1, 3, 'Atualizando franqueados...');

      const cobrancas = await this.syncCobrancasIncremental(lastSyncAt);
      this.updateProgress(2, 3, 'Atualizando cobranças...');

      const usuariosInternos = await this.syncUsuariosInternosIncremental(lastSyncAt);
      this.updateProgress(3, 3, 'Finalizado!');

      const syncTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          franqueados,
          cobrancas,
          usuariosInternos,
        },
        stats: {
          franqueados: franqueados.length,
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

  private async syncFranqueadosIncremental(lastSyncAt: Date): Promise<Franqueado[]> {
    try {
      // TODO: Implementar busca incremental quando tivermos banco matriz
      const { data } = await supabase
        .from('franqueados')
        .select('*')
        .gte('updated_at', lastSyncAt.toISOString())
        .order('updated_at', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Erro na sincronização incremental de franqueados:', error);
      return [];
    }
  }

  private async syncCobrancasIncremental(lastSyncAt: Date): Promise<Cobranca[]> {
    try {
      const { data } = await supabase
        .from('cobrancas')
        .select('*')
        .gte('updated_at', lastSyncAt.toISOString())
        .order('updated_at', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Erro na sincronização incremental de cobranças:', error);
      return [];
    }
  }

  private async syncUsuariosInternosIncremental(lastSyncAt: Date): Promise<UsuarioInterno[]> {
    try {
      const { data } = await supabase
        .from('usuarios_internos')
        .select('*')
        .gte('updated_at', lastSyncAt.toISOString())
        .order('updated_at', { ascending: false });
      
      return data || [];
    } catch (error) {
      console.error('Erro na sincronização incremental de usuários:', error);
      return [];
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