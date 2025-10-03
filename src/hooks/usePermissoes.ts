import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PermissoesService } from '../api/permissoesService';
import type { PermissaoFormData } from '../types/permissoes';
import toast from 'react-hot-toast';

export const permissoesKeys = {
  all: ['permissoes'] as const,
  list: () => [...permissoesKeys.all, 'list'] as const,
};

export function usePermissoes() {
  return useQuery({
    queryKey: permissoesKeys.list(),
    queryFn: () => PermissoesService.getPermissoes(),
  });
}

export function useCreatePermissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dados: PermissaoFormData) => PermissoesService.createPermissao(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissoesKeys.list() });
      toast.success('Permissão criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar permissão: ${error.message}`);
    },
  });
}

export function useUpdatePermissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: Partial<PermissaoFormData> }) =>
      PermissoesService.updatePermissao(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissoesKeys.list() });
      toast.success('Permissão atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar permissão: ${error.message}`);
    },
  });
}

export function useDeletePermissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => PermissoesService.deletePermissao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissoesKeys.list() });
      toast.success('Permissão excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir permissão: ${error.message}`);
    },
  });
}