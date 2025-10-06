import { useMutation, useQueryClient } from '@tanstack/react-query';
import { iaConnectorService } from '../api/iaConnectorService';
import { useChatWidgetStore } from '../store/chatWidgetStore';
import { chatKeys } from './useChatHistory';
import toast from 'react-hot-toast';

export function useWidgetChatIA() {
  const {
    addMessage,
    startLoading,
    stopLoading,
    setChatId,
  } = useChatWidgetStore();
  const queryClient = useQueryClient();

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ prompt, chatId }: { prompt: string; chatId: string | null }) => {
      const userMessage = { id: `user-${Date.now()}`, role: 'user' as const, content: prompt, created_at: new Date().toISOString() };
      addMessage(userMessage);
      startLoading();
      return iaConnectorService.gerarResposta(prompt, 'agente_chat_interno', chatId);
    },
    onSuccess: (data) => {
      const assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant' as const, content: data.response, created_at: new Date().toISOString() };
      addMessage(assistantMessage);
      setChatId(data.chatId);
      queryClient.invalidateQueries({ queryKey: chatKeys.list() }); // Atualiza a lista de chats na sidebar
    },
    onError: (error: Error) => {
      const errorMessage = { id: `error-${Date.now()}`, role: 'assistant' as const, content: `Desculpe, ocorreu um erro: ${error.message}`, created_at: new Date().toISOString() };
      addMessage(errorMessage);
      toast.error(`Erro ao comunicar com a IA: ${error.message}`);
    },
    onSettled: () => {
      stopLoading();
    },
  });

  return {
    sendMessage,
  };
}