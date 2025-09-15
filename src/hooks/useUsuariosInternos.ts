import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { UsuariosInternosService } from "../api/usuariosInternosService";
import type {
  UsuarioInternoCreate,
  UsuarioInternoUpdate,
  UsuarioInternoFormData,
  FiltrosUsuarios,
} from "../types/equipes";

// ==============================================
// QUERY KEYS
// ==============================================

export const usuariosInternosKeys = {
  all: ["usuarios-internos"] as const,
  lists: () => [...usuariosInternosKeys.all, "list"] as const,
  list: (filters: FiltrosUsuarios) => [...usuariosInternosKeys.lists(), filters] as const,
  details: () => [...usuariosInternosKeys.all, "detail"] as const,
  detail: (id: string) => [...usuariosInternosKeys.details(), id] as const,
  byAuthId: (authId: string) => [...usuariosInternosKeys.all, "auth", authId] as const,
  byEquipe: (equipeId: string) => [...usuariosInternosKeys.all, "equipe", equipeId] as const,
  estatisticas: () => [...usuariosInternosKeys.all, "estatisticas"] as const,
};

// ==============================================
// HOOKS DE CONSULTA
// ==============================================

// Hook para buscar usuários internos com filtros
export function useUsuariosInternos(filtros?: FiltrosUsuarios) {
  return useQuery({
    queryKey: usuariosInternosKeys.list(filtros || {}),
    queryFn: () => UsuariosInternosService.buscarUsuarios(filtros),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar usuário por ID
export function useUsuarioInterno(id: string) {
  return useQuery({
    queryKey: usuariosInternosKeys.detail(id),
    queryFn: () => UsuariosInternosService.buscarUsuarioPorId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook para buscar usuário por auth ID
export function useUsuarioInternoPorAuthId(authId: string) {
  return useQuery({
    queryKey: usuariosInternosKeys.byAuthId(authId),
    queryFn: () => UsuariosInternosService.buscarUsuarioPorAuthId(authId),
    enabled: !!authId,
    staleTime: 10 * 60 * 1000, // 10 minutos (dados do usuário logado)
  });
}

// Hook para buscar usuários por equipe
export function useUsuariosPorEquipe(equipeId: string) {
  return useQuery({
    queryKey: usuariosInternosKeys.byEquipe(equipeId),
    queryFn: () => UsuariosInternosService.buscarUsuariosPorEquipe(equipeId),
    enabled: !!equipeId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook para estatísticas dos usuários
export function useEstatisticasUsuarios() {
  return useQuery({
    queryKey: usuariosInternosKeys.estatisticas(),
    queryFn: () => UsuariosInternosService.obterEstatisticas(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// ==============================================
// HOOKS DE MUTAÇÃO
// ==============================================

// Hook para criar usuário interno
export function useCreateUsuarioInterno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (usuarioForm: UsuarioInternoFormData) => {
      // Converter dados do formulário para o formato esperado pelo service
      const usuarioCreate: UsuarioInternoCreate = {
        nome: usuarioForm.nome,
        email: usuarioForm.email,
        telefone: usuarioForm.telefone || undefined,
        perfil: usuarioForm.perfil,
        equipe_id: usuarioForm.equipe_id,
        status: usuarioForm.status,
        // O campo senha será gerado automaticamente pelo service
      };
      
      const resultado = await UsuariosInternosService.criarUsuario(usuarioCreate);
      return resultado;
    },
    onSuccess: (novoUsuario) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: usuariosInternosKeys.all });
      
      // Toast de sucesso com informações sobre o envio do email
      toast.success(
        `Usuário "${novoUsuario.nome}" criado com sucesso!\n\n` +
        `As credenciais de acesso foram enviadas por email para: ${novoUsuario.email}\n` +
        `O usuário receberá um email com login e senha temporária.`,
        {
          duration: 6000,
        }
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar usuário: ${error.message}`);
    },
  });
}

// Hook para atualizar usuário interno
export function useUpdateUsuarioInterno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UsuarioInternoUpdate }) =>
      UsuariosInternosService.atualizarUsuario(id, updates),
    onSuccess: (usuarioAtualizado) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: usuariosInternosKeys.all });
      
      // Atualizar cache específico
      queryClient.setQueryData(
        usuariosInternosKeys.detail(usuarioAtualizado.id),
        usuarioAtualizado
      );
      
      toast.success(`Usuário "${usuarioAtualizado.nome}" atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });
}

// Hook para inativar usuário
export function useInativarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UsuariosInternosService.inativarUsuario(id),
    onSuccess: () => {
      // Invalidar todas as queries de usuários
      queryClient.invalidateQueries({ queryKey: usuariosInternosKeys.all });
      
      toast.success("Usuário inativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao inativar usuário: ${error.message}`);
    },
  });
}

// Hook para ativar usuário
export function useAtivarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => UsuariosInternosService.ativarUsuario(id),
    onSuccess: () => {
      // Invalidar todas as queries de usuários
      queryClient.invalidateQueries({ queryKey: usuariosInternosKeys.all });
      
      toast.success("Usuário ativado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao ativar usuário: ${error.message}`);
    },
  });
}

// Hook para resetar senha
export function useResetarSenhaUsuario() {
  return useMutation({
    mutationFn: (email: string) => UsuariosInternosService.resetarSenha(email),
    onSuccess: () => {
      toast.success("Email de redefinição de senha enviado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar email de redefinição: ${error.message}`);
    },
  });
}

// Hook para verificar se email existe
export function useVerificarEmail() {
  return useMutation({
    mutationFn: ({ email, excludeId }: { email: string; excludeId?: string }) =>
      UsuariosInternosService.emailExiste(email, excludeId),
  });
}

// ==============================================
// HOOKS AUXILIARES
// ==============================================

// Hook para buscar dados completos de um usuário com validações
export function useUsuarioCompletoComValidacoes(id: string) {
  const usuarioQuery = useUsuarioInterno(id);
  const verificarEmailMutation = useVerificarEmail();

  const verificarEmailDisponivel = async (email: string) => {
    if (!email || email === usuarioQuery.data?.email) {
      return true;
    }
    
    const emailExiste = await verificarEmailMutation.mutateAsync({
      email,
      excludeId: id,
    });
    
    return !emailExiste;
  };

  return {
    usuario: usuarioQuery.data,
    isLoading: usuarioQuery.isLoading,
    error: usuarioQuery.error,
    verificarEmailDisponivel,
    isVerificandoEmail: verificarEmailMutation.isPending,
  };
}
