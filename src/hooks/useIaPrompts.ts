import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iaPromptsService } from '../api/iaPromptsService';
import type { IaPromptUpdate } from '../types/ia';
import toast from 'react-hot-toast';

export const iaPromptsKeys = {
  all: ['ia_prompts'] as const,
  list: () => [...iaPromptsKeys.all, 'list'] as const,
};

export function useIaPrompts() {
  return useQuery({
    queryKey: iaPromptsKeys.list(),
    queryFn: () => iaPromptsService.getPrompts(),
  });
}

export function useUpdateIaPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: IaPromptUpdate }) =>
      iaPromptsService.updatePrompt(id, updates),
    onSuccess: (updatedPrompt) => {
      queryClient.invalidateQueries({ queryKey: iaPromptsKeys.list() });
      toast.success(`Prompt para "${updatedPrompt.nome_agente}" atualizado com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar prompt: ${error.message}`);
    },
  });
}