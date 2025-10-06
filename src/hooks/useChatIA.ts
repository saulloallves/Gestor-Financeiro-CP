import { useMutation, useQueryClient } from '@tanstack/react-query';
import { iaConnectorService } from '../api/iaConnectorService';
import { chatKeys } from './useChatHistory';
import toast from 'react-hot-toast';

export function useChatIA(setActiveChatId: (id: string) => void) {
  const queryClient = useQueryClient();

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: async ({ prompt, chatId }: { prompt: string; chatId: string | null }) => {
      // Adicionar mensagem do usuário à UI imediatamente (otimismo)
      queryClient.setQueryData(chatKeys.messages(chatId || 'new'), (oldData: any) => {
        const newMessage = { id: `user-${Date.now()}`, role: 'user', content: prompt, created_at: new Date().toISOString() };
        return oldData ? [...oldData, newMessage] : [newMessage];
      });

      return iaConnectorService.gerarResposta(prompt, 'agente_chat_interno', chatId);
    },
    onSuccess: (data, variables) => {
      const { chatId: newChatId } = data;
      const originalChatId = variables.chatId;

      // Se era um novo chat, o backend retorna o novo ID
      if (!originalChatId && newChatId) {
        setActiveChatId(newChatId);
        // Invalida a query do chat 'new' para limpá-la
        queryClient.invalidateQueries({ queryKey: chatKeys.messages('new') });
      }
      
      // Invalida as queries para buscar a lista de chats (caso um novo tenha sido criado)
      // e as mensagens do chat atual (para obter a resposta real da IA)
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(newChatId) });
    },
    onError: (error, variables) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao comunicar com a IA: ${errorMessage}`);
      // Reverter a atualização otimista em caso de erro
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(variables.chatId || 'new') });
    },
  });

  return {
    sendMessage,
    isLoading,
  };
}