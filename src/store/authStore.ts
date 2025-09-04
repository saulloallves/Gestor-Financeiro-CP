import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, LoginInternoData, LoginFranqueadoData, LoginUnidadeData, Usuario } from '../types/auth';
import { AuthService } from '../api/authService';
import toast from 'react-hot-toast';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      tipoAcesso: null,
      isLoading: false,

      login: async (dados: LoginInternoData | LoginFranqueadoData | LoginUnidadeData, tipo: 'interno' | 'franqueado' | 'unidade') => {
        set({ isLoading: true });
        
        try {
          let usuario: Usuario;

          if (tipo === 'interno') {
            usuario = await AuthService.loginInterno(dados as LoginInternoData);
            set({ 
              usuario, 
              tipoAcesso: 'interno',
              isLoading: false 
            });
            toast.success(`Bem-vindo, ${usuario.nome}!`);
          } else if (tipo === 'franqueado') {
            usuario = await AuthService.loginFranqueado(dados as LoginFranqueadoData);
            set({ 
              usuario, 
              tipoAcesso: 'franqueado',
              isLoading: false 
            });
            toast.success(`Bem-vindo ao portal, ${usuario.nome}!`);
          } else if (tipo === 'unidade') {
            // Para futuro: implementar login por código de unidade
            // Por enquanto, redirect para franqueado
            throw new Error('Login por código de unidade ainda não implementado. Use o email do franqueado.');
          }

        } catch (error) {
          set({ isLoading: false });
          const errorMessage = error instanceof Error ? error.message : 'Erro ao realizar login';
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: async () => {
        try {
          await AuthService.logout();
          set({ usuario: null, tipoAcesso: null });
          toast.success('Logout realizado com sucesso!');
        } catch {
          // Mesmo com erro no Supabase, faz logout local
          set({ usuario: null, tipoAcesso: null });
          toast.success('Sessão encerrada!');
        }
      },

      // Método para inicializar o estado (verificar sessão ativa)
      initializeAuth: async () => {
        try {
          const usuario = await AuthService.getCurrentUser();
          if (usuario) {
            // Determina o tipo de acesso baseado na estrutura do usuário
            const tipoAcesso = 'perfil' in usuario ? 'interno' : 'franqueado';
            set({ usuario, tipoAcesso });
          }
        } catch (error) {
          console.error('Erro ao inicializar autenticação:', error);
          // Em caso de erro, limpa o estado
          set({ usuario: null, tipoAcesso: null });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        usuario: state.usuario, 
        tipoAcesso: state.tipoAcesso 
      }),
    }
  )
);
