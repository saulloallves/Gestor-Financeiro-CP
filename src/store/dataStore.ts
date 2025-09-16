import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { syncService } from '../services/syncService';
import type { Cobranca } from '../types/cobrancas';
import type { Franqueado } from '../types/franqueados';
import type { UsuarioInterno } from '../types/auth';

export interface SyncStatus {
  isLoading: boolean;
  lastSyncAt: Date | null;
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
  usuariosInternos: UsuarioInterno[];
}

export interface DataStoreState extends DataCache {
  sync: SyncStatus;
  
  // Ações principais
  loadAllData: () => Promise<void>;
  refreshData: (force?: boolean) => Promise<void>;
  clearCache: () => void;
  
  // Ações específicas para cada entidade
  updateCobranca: (cobranca: Cobranca) => void;
  addCobranca: (cobranca: Cobranca) => void;
  removeCobranca: (id: string) => void;
  
  updateFranqueado: (franqueado: Franqueado) => void;
  addFranqueado: (franqueado: Franqueado) => void;
  removeFranqueado: (id: string) => void;
  
  // Utilitários de busca local
  getCobrancaById: (id: string) => Cobranca | undefined;
  getCobrancasByFranqueado: (franqueadoId: string) => Cobranca[];
  getCobrancasByStatus: (status: Cobranca['status']) => Cobranca[];
  getCobrancasByUnidade: (codigoUnidade: number) => Cobranca[];
  
  getFranqueadoById: (id: string) => Franqueado | undefined;
  getFranqueadoByCpf: (cpf: string) => Franqueado | undefined;
  getFranqueadosAtivos: () => Franqueado[];
  
  // Estatísticas calculadas localmente
  getEstatisticasCobrancas: () => {
    totalCobrancas: number;
    valorTotalEmAberto: number;
    valorTotalVencido: number;
    cobrancasVencidas: number;
    cobrancasPagas: number;
  };
}

const initialState: DataCache & { sync: SyncStatus } = {
  franqueados: [],
  cobrancas: [],
  usuariosInternos: [],
  sync: {
    isLoading: false,
    lastSyncAt: null,
    hasInitialLoad: false,
    error: null,
    progress: null,
  },
};

export const useDataStore = create<DataStoreState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // Implementações das ações principais
      loadAllData: async () => {
        set((state) => {
          state.sync.isLoading = true;
          state.sync.error = null;
          state.sync.progress = { current: 0, total: 3, stage: 'Iniciando sincronização...' };
        });

        try {
          const result = await syncService.syncAllData();
          
          if (result.success && result.data) {
            set((state) => {
              state.franqueados = result.data!.franqueados;
              state.cobrancas = result.data!.cobrancas;
              state.usuariosInternos = result.data!.usuariosInternos;
              
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
        const { lastSyncAt } = get().sync;
        
        // Se não forçar e a última sync foi há menos de 5 minutos, pular
        if (!force && lastSyncAt && (Date.now() - lastSyncAt.getTime()) < 5 * 60 * 1000) {
          return;
        }

        await get().loadAllData();
      },

      clearCache: () => {
        set((state) => {
          state.franqueados = [];
          state.cobrancas = [];
          state.usuariosInternos = [];
          state.sync.hasInitialLoad = false;
          state.sync.lastSyncAt = null;
          state.sync.error = null;
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

      // Ações para Franqueados
      updateFranqueado: (franqueado: Franqueado) => {
        set((state) => {
          const index = state.franqueados.findIndex(f => f.id === franqueado.id);
          if (index >= 0) {
            state.franqueados[index] = franqueado;
          }
        });
      },

      addFranqueado: (franqueado: Franqueado) => {
        set((state) => {
          state.franqueados.push(franqueado);
        });
      },

      removeFranqueado: (id: string) => {
        set((state) => {
          state.franqueados = state.franqueados.filter(f => f.id !== id);
        });
      },

      // Utilitários de busca local para Cobranças
      getCobrancaById: (id: string) => {
        return get().cobrancas.find(c => c.id === id);
      },

      getCobrancasByFranqueado: (_franqueadoId: string) => {
        // TODO: Implementar quando tivermos a relação franqueado-unidade no banco matriz
        return get().cobrancas.filter((_c) => {
          // Placeholder - será implementado quando integrarmos com banco matriz
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

      // Estatísticas calculadas localmente
      getEstatisticasCobrancas: () => {
        const { cobrancas } = get();
        const dataAtual = new Date();

        const estatisticas = {
          totalCobrancas: cobrancas.length,
          valorTotalEmAberto: 0,
          valorTotalVencido: 0,
          cobrancasVencidas: 0,
          cobrancasPagas: 0,
        };

        cobrancas.forEach(cobranca => {
          const dataVencimento = new Date(cobranca.vencimento);
          const isVencida = dataVencimento < dataAtual;

          if (cobranca.status === 'pago') {
            estatisticas.cobrancasPagas++;
          } else {
            estatisticas.valorTotalEmAberto += Number(cobranca.valor_atualizado || 0);
            
            if (isVencida) {
              estatisticas.cobrancasVencidas++;
              estatisticas.valorTotalVencido += Number(cobranca.valor_atualizado || 0);
            }
          }
        });

        return estatisticas;
      },
    })),
    {
      name: 'data-store',
      partialize: (state: DataStoreState) => ({
        // Persistir apenas os dados, não os estados de sync
        franqueados: state.franqueados,
        cobrancas: state.cobrancas,
        usuariosInternos: state.usuariosInternos,
        sync: {
          ...state.sync,
          isLoading: false, // Sempre iniciar com loading false
          progress: null,
        }
      }),
    }
  )
);