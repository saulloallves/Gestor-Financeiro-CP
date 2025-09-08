import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UsuariosInternosService } from '../api/usuariosInternosService';
import { useAuthStore } from '../store/authStore';
import type { Usuario } from '../types/auth';

interface AuthStateResult {
  isLoading: boolean;
  precisaTrocarSenha: boolean;
  primeiroAcesso: boolean;
  senhaTemporaria: boolean;
  isAuthenticated: boolean;
  userInfo: Usuario | null;
}

interface AuthActions {
  verificarPrimeiroAcesso: () => Promise<void>;
  marcarPrimeiroAcessoCompleto: () => Promise<boolean>;
  refetchAuthState: () => void;
}

export function useAuthState(): AuthStateResult & AuthActions {
  const { usuario, tipoAcesso } = useAuthStore();
  const queryClient = useQueryClient();
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
  const [primeiroAcesso, setPrimeiroAcesso] = useState(false);
  const [senhaTemporaria, setSenhaTemporaria] = useState(false);

  const isAuthenticated = !!usuario;
  const isUsuarioInterno = tipoAcesso === 'interno';
  
  // Type guard para UsuarioInterno
  const usuarioInterno = isUsuarioInterno && usuario && 'perfil' in usuario ? usuario : null;

  const {
    data: authStateData,
    isLoading: isLoadingAuthState,
    refetch: refetchAuthQuery
  } = useQuery({
    queryKey: ['auth-state', usuarioInterno?.user_id],
    queryFn: async () => {
      if (!usuarioInterno?.user_id) return null;
      
      const resultado = await UsuariosInternosService.verificarPrecisaTrocarSenha(usuarioInterno.user_id);
      return resultado;
    },
    enabled: !!usuarioInterno?.user_id && isAuthenticated && isUsuarioInterno,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (authStateData) {
      setPrecisaTrocarSenha(authStateData.precisa_trocar);
      setPrimeiroAcesso(authStateData.primeiro_acesso);
      setSenhaTemporaria(authStateData.senha_temporaria);
    } else {
      setPrecisaTrocarSenha(false);
      setPrimeiroAcesso(false);
      setSenhaTemporaria(false);
    }
  }, [authStateData]);

  const verificarPrimeiroAcesso = useCallback(async () => {
    if (!usuarioInterno?.user_id) return;
    
    try {
      await refetchAuthQuery();
    } catch (error) {
      console.error('Erro ao verificar primeiro acesso:', error);
    }
  }, [usuarioInterno?.user_id, refetchAuthQuery]);

  const marcarPrimeiroAcessoCompleto = useCallback(async (): Promise<boolean> => {
    if (!usuarioInterno?.user_id) return false;
    
    try {
      const sucesso = await UsuariosInternosService.marcarPrimeiroAcessoCompleto(usuarioInterno.user_id);
      
      if (sucesso) {
        queryClient.invalidateQueries({ queryKey: ['auth-state'] });
        
        setPrecisaTrocarSenha(false);
        setPrimeiroAcesso(false);
        setSenhaTemporaria(false);
      }
      
      return sucesso;
    } catch (error) {
      console.error('Erro ao marcar primeiro acesso como completo:', error);
      return false;
    }
  }, [usuarioInterno?.user_id, queryClient]);

  const refetchAuthState = useCallback(() => {
    refetchAuthQuery();
  }, [refetchAuthQuery]);

  return {
    isLoading: isLoadingAuthState,
    precisaTrocarSenha,
    primeiroAcesso,
    senhaTemporaria,
    isAuthenticated,
    userInfo: usuario,
    verificarPrimeiroAcesso,
    marcarPrimeiroAcessoCompleto,
    refetchAuthState,
  };
}
