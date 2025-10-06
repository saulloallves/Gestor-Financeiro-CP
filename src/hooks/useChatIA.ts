import { useMutation, useQueryClient } from '@tanstack/react-query';
import { iaConnectorService } from '../api/iaConnectorService';
import { chatKeys } from './useChatHistory';
import toast from 'react-hot-toast';

export function useChatIA(activeChatId: string | null, setActiveChatId: (id: string) => void) {
  const queryClient = useQueryClient();

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: async (prompt: string) => {
      // Adicionar mensagem do usuário à UI imediatamente (otimismo)
      queryClient.setQueryData(chatKeys.messages(activeChatId || 'new'), (oldData: any) => {
        const newMessage = { id: `user-${Date.now()}`, role: 'user', content: prompt, created_at: new Date().toISOString() };
        return oldData ? [...oldData, newMessage] : [newMessage];
      });

      return iaConnectorService.gerarResposta(prompt, 'agente_chat_interno', activeChatId);
    },
    onSuccess: (data) => {
      const { chatId } = data;
      // Se era um novo chat, o backend retorna o novo ID
      if (!activeChatId && chatId) {
        setActiveChatId(chatId);
      }
      // Invalida as queries para buscar a lista de chats (caso um novo tenha sido criado)
      // e as mensagens do chat atual (para obter a resposta real da IA)
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(chatId) });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao comunicar com a IA: ${errorMessage}`);
      // Reverter a atualização otimista em caso de erro
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(activeChatId || 'new') });
    },
  });

  return {
    sendMessage,
    isLoading,
  };
}