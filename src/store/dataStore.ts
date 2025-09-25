import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { syncService } from '../services/syncService';
import type { Cobranca } from '../types/cobrancas';
import type { Franqueado } from '../types/franqueados';
import type { Unidade } from '../types/unidades';
import type { UsuarioInterno } from '../types/auth';
import type { Comunicacao } from '../types/comunicacao';
import type { SyncData } from '../services/syncService';

export interface SyncStatus {
  isLoading: boolean;
  lastSyncAt: Date | string | null;
  hasInitialLoad: boolean;
  error: string | null;
  progress: {
    current: number;
    total: number;
    stage: string;
  } | null;
}

export interface DataCache {
  franqueados: Franqueado[];
  cobrancas: Cobranca[];
  unidades: Unidade[];
  usuariosInternos: UsuarioInterno[];
  comunicacoes: Comunicacao[];
}

export interface DataStoreState extends DataCache {
  sync: SyncStatus;
  
  // Ações principais
  loadAllData: (force?: boolean) => Promise<void>;
  refreshData: (force?: boolean) => Promise<void>;
  clearCache: () => void;
  mergeUpdates: (updates: Partial<SyncData>) => void;
  
  // Ações específicas para cada entidade
  updateCobranca: (cobranca: Cobranca) => void;
  addCobranca: (cobranca: Cobranca) => void;
  removeCobranca: (id: string) => void;
  
  addOrUpdateUnidade: (unidade: Unidade) => void;
  addOrUpdateFranqueado: (franqueado: Franqueado) => void;
  
  // Utilitários de busca local
  getCobrancaById: (id: string) => Cobranca | undefined;
  getCobrancasByFranqueado: (franqueadoId: string) => Cobranca[];
  getCobrancasByStatus: (status: Cobranca['status']) => Cobranca[];
  getCobrancasByUnidade: (codigoUnidade: number) => Cobranca[];
  
  getFranqueadoById: (id: string) => Franqueado | undefined;
  getFranqueadoByCpf: (cpf: string) => Franqueado | undefined;
  getFranqueadosAtivos: () => Franqueado[];
}

const initialState: DataCache & { sync: SyncStatus } = {
  franqueados: [],
  cobrancas: [],
  unidades: [],
  usuariosInternos: [],
  comunicacoes: [],
  sync: {
    isLoading: false,
    lastSyncAt: null,
    hasInitialLoad: false,
    error: null,
    progress: null,
  },
};

export const useDataStore = create<DataStoreState>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Implementações das ações principais
      loadAllData: async (force = false) => {
        const store = get();
        
        const hasData = 
          store.franqueados.length > 0 && 
          store.unidades.length > 0 &&
          store.cobrancas.length > 0;
        
        const hasCacheValid = store.sync.hasInitialLoad && hasData;
        
        if (hasCacheValid && !force) {
          console.log('✅ Dados já estão em cache - ignorando nova sincronização');
          return;
        }
        
        if (store.sync.isLoading) {
          console.log('Sincronização já em andamento, ignorando...');
          return;
        }

        console.log(`🔄 ${force ? 'Forçando' : 'Iniciando'} sincronização completa de dados...`);

        set((state) => {
          state.sync.isLoading = true;
          state.sync.error = null;
          state.sync.progress = { current: 0, total: 5, stage: 'Iniciando...' };
        });

        try {
          const result = await syncService.syncAllData();
          
          if (result.success && result.data) {
            set((state) => {
              state.franqueados = result.data!.franqueados;
              state.cobrancas = result.data!.cobrancas;
              state.unidades = result.data!.unidades;
              state.usuariosInternos = result.data!.usuariosInternos;
              state.comunicacoes = result.data!.comunicacoes;
              
              state.sync.isLoading = false;
              state.sync.hasInitialLoad = true;
              state.sync.lastSyncAt = new Date();
              state.sync.error = null;
              state.sync.progress = null;
            });
          } else {
            throw new Error(result.error || 'Erro desconhecido na sincronização');
          }
        } catch (error) {
          set((state) => {
            state.sync.isLoading = false;
            state.sync.error = error instanceof Error ? error.message : 'Erro desconhecido';
            state.sync.progress = null;
          });
        }
      },

      refreshData: async (force = false) => {
        const { lastSyncAt, isLoading } = get().sync;
        
        if (isLoading) return;

        if (!force && lastSyncAt) {
          const syncDate = lastSyncAt instanceof Date ? lastSyncAt : new Date(lastSyncAt);
          if ((Date.now() - syncDate.getTime()) < 1 * 60 * 1000) { // 1 minuto
            console.log('Dados ainda são recentes, pulando refresh incremental.');
            return;
          }
          
          set(state => { state.sync.isLoading = true; });
          const result = await syncService.syncIncremental(syncDate);
          if (result.success && result.updates) {
            get().mergeUpdates(result.updates);
          }
          set(state => { state.sync.isLoading = false; state.sync.lastSyncAt = new Date(); });

        } else {
          await get().loadAllData(force);
        }
      },

      clearCache: () => {
        set((state) => {
          state.franqueados = [];
          state.cobrancas = [];
          state.unidades = [];
          state.usuariosInternos = [];
          state.comunicacoes = [];
          state.sync.hasInitialLoad = false;
          state.sync.lastSyncAt = null;
          state.sync.error = null;
          state.sync.isLoading = false;
          state.sync.progress = null;
        });
      },

      mergeUpdates: (updates) => {
        set(state => {
          const merge = <T extends { id: string }>(current: T[], updated: T[] | undefined) => {
            if (!updated || updated.length === 0) return current;
            const map = new Map(current.map(item => [item.id, item]));
            updated.forEach(item => map.set(item.id, item));
            return Array.from(map.values());
          };

          state.franqueados = merge(state.franqueados, updates.franqueados);
          state.unidades = merge(state.unidades, updates.unidades);
          state.cobrancas = merge(state.cobrancas, updates.cobrancas);
          state.usuariosInternos = merge(state.usuariosInternos, updates.usuariosInternos);
          state.comunicacoes = merge(state.comunicacoes, updates.comunicacoes);
        });
      },

      // Ações para Cobranças
      updateCobranca: (cobranca: Cobranca) => {
        set((state) => {
          const index = state.cobrancas.findIndex(c => c.id === cobranca.id);
          if (index >= 0) {
            state.cobrancas[index] = cobranca;
          }
        });
      },

      addCobranca: (cobranca: Cobranca) => {
        set((state) => {
          state.cobrancas.unshift(cobranca);
        });
      },

      removeCobranca: (id: string) => {
        set((state) => {
          state.cobrancas = state.cobrancas.filter(c => c.id !== id);
        });
      },

      // Ações para Unidades e Franqueados (Realtime)
      addOrUpdateUnidade: (unidade: Unidade) => {
        set(state => {
          const index = state.unidades.findIndex(u => u.id === unidade.id);
          if (index !== -1) {
            state.unidades[index] = unidade;
          } else {
            state.unidades.push(unidade);
          }
        });
      },

      addOrUpdateFranqueado: (franqueado: Franqueado) => {
        set(state => {
          const index = state.franqueados.findIndex(f => f.id === franqueado.id);
          if (index !== -1) {
            state.franqueados[index] = franqueado;
          } else {
            state.franqueados.push(franqueado);
          }
        });
      },
      
      // Utilitários de busca local para Cobranças
      getCobrancaById: (id: string) => {
        return get().cobrancas.find(c => c.id === id);
      },

      getCobrancasByFranqueado: (_franqueadoId: string) => {
        return get().cobrancas.filter((_c) => {
          return false;
        });
      },

      getCobrancasByStatus: (status: Cobranca['status']) => {
        return get().cobrancas.filter(c => c.status === status);
      },

      getCobrancasByUnidade: (codigoUnidade: number) => {
        return get().cobrancas.filter(c => c.codigo_unidade === codigoUnidade);
      },

      // Utilitários de busca local para Franqueados
      getFranqueadoById: (id: string) => {
        return get().franqueados.find(f => f.id === id);
      },

      getFranqueadoByCpf: (cpf: string) => {
        return get().franqueados.find(f => f.cpf === cpf);
      },

      getFranqueadosAtivos: () => {
        return get().franqueados.filter(f => f.status === 'ativo');
      },
    })),
    {
      name: 'data-store',
      partialize: (state: DataStoreState) => ({
        franqueados: state.franqueados,
        cobrancas: state.cobrancas,
        unidades: state.unidades,
        usuariosInternos: state.usuariosInternos,
        comunicacoes: state.comunicacoes,
        sync: {
          ...state.sync,
          isLoading: false,
          progress: null,
        }
      }),
      onRehydrateStorage: () => {
        console.log('🔧 Iniciando hidratação do cache...');
        return (state?: DataStoreState, error?: unknown) => {
          if (error) {
            console.error('❌ Erro na hidratação do cache:', error);
          } else {
            console.log('✅ Cache hidratado com sucesso:', {
              franqueados: state?.franqueados?.length || 0,
              cobrancas: state?.cobrancas?.length || 0,
              unidades: state?.unidades?.length || 0,
              comunicacoes: state?.comunicacoes?.length || 0,
              hasInitialLoad: state?.sync?.hasInitialLoad || false,
              lastSyncAt: state?.sync?.lastSyncAt ? 'Data válida' : 'Nenhuma'
            });
          }
        };
      }
    }
  )
);