import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesService } from '../api/templatesService';
import type { TemplateFormData } from '../types/comunicacao';
import toast from 'react-hot-toast';

export const useTemplates = () => {
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesService.getTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: TemplateFormData) => templatesService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      templatesService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  return {
    templates: templatesQuery.data,
    isLoading: templatesQuery.isLoading,
    createTemplate: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTemplate: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

export const useTestTemplate = () => {
  return useMutation({
    mutationFn: (params: { cobranca_id: string; template_name: string; phone_number?: string }) =>
      templatesService.testTemplate(params.cobranca_id, params.template_name, params.phone_number),
    onSuccess: (data) => {
      toast.success('Mensagem de teste enviada com sucesso!');
      console.log('Resposta do teste:', data);
    },
    onError: (error) => {
      toast.error(`Erro ao enviar teste: ${error.message}`);
    },
  });
};