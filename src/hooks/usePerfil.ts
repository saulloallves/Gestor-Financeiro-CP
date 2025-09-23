import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PerfilService } from '../api/perfilService';
import type {
  PerfilUsuario,
  EditarDadosPessoaisData,
  AlterarSenhaData,
} from '../types/perfil';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

// Chaves para o React Query
export const perfilKeys = {
  all: ['perfil'] as const,
  usuario: () => [...perfilKeys.all, 'usuario'] as const,
};

// Hook para buscar dados do perfil
export function usePerfil() {
  return useQuery({
    queryKey: perfilKeys.usuario(),
    queryFn: PerfilService.getPerfilUsuario,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
}

// Hook para atualizar dados pessoais
export function useAtualizarDadosPessoais() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: EditarDadosPessoaisData) =>
      PerfilService.atualizarDadosPessoais(dados),
    onSuccess: (response) => {
      if (response.success) {
        // Atualiza o cache do perfil
        queryClient.setQueryData(perfilKeys.usuario(), (oldData: PerfilUsuario | undefined) => {
          if (!oldData || !response.data) return oldData;
          
          return {
            ...oldData,
            nome: response.data.nome,
            email: response.data.email,
            telefone: response.data.telefone, // Já vem formatado do service
          };
        });

        // Revalida os dados
        queryClient.invalidateQueries({ queryKey: perfilKeys.usuario() });
        
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      console.error('Erro ao atualizar dados pessoais:', error);
      toast.error('Erro ao atualizar dados pessoais');
    },
  });
}

// Hook para alterar senha
export function useAlterarSenha() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (dados: AlterarSenhaData) =>
      PerfilService.alterarSenha(dados),
    onSuccess: async (response) => {
      if (response.success) {
        toast.success(response.message);
        
        // Aguarda um pouco para o usuário ver a mensagem de sucesso
        setTimeout(async () => {
          try {
            // Força logout por segurança
            await logout();
            
            // Redireciona para login
            navigate('/login');
            
            // Mostra notificação sobre o logout de segurança
            toast.success('Por segurança, você foi desconectado. Faça login novamente com sua nova senha.');
          } catch (error) {
            console.error('Erro no logout após alteração de senha:', error);
            // Mesmo com erro, força navegação para login
            navigate('/login');
            toast.success('Senha alterada! Faça login novamente com sua nova senha.');
          }
        }, 1500);
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    },
  });
}

// Hook para upload de foto
export function useUploadFotoPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      // Validações do arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem');
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }
      
      return PerfilService.uploadFotoPerfil(file);
    },
    onSuccess: (result) => {
      // Atualiza o cache do perfil com a nova foto
      queryClient.setQueryData(perfilKeys.usuario(), (oldData: PerfilUsuario | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          fotoPerfil: result.url,
        };
      });

      // Revalida os dados
      queryClient.invalidateQueries({ queryKey: perfilKeys.usuario() });
      
      toast.success('Foto atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro no upload da foto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da foto';
      toast.error(errorMessage);
    },
  });
}

// Hook para remover foto de perfil
export function useRemoverFotoPerfil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PerfilService.removerFotoPerfil(),
    onSuccess: () => {
      // Atualiza o cache removendo a foto
      queryClient.setQueryData(perfilKeys.usuario(), (oldData: PerfilUsuario | undefined) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          fotoPerfil: undefined,
        };
      });

      // Revalida os dados
      queryClient.invalidateQueries({ queryKey: perfilKeys.usuario() });
      
      toast.success('Foto removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover foto:', error);
      toast.error('Erro ao remover foto');
    },
  });
}