import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';
import toast from 'react-hot-toast';

export const chatKeys = {
  all: ['chats'] as const,
  list: () => [...chatKeys.all, 'list'] as const,
  messages: (chatId: string) => [...chatKeys.all, 'messages', chatId] as const,
};

// Hook para buscar a lista de chats do usuário
export function useChatHistory() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, created_at')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

// Hook para buscar as mensagens de um chat específico
export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: chatKeys.messages(chatId!),
    queryFn: async () => {
      if (!chatId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!chatId,
  });
}

// Hook para deletar um chat
export function useDeleteChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: string) => {
      const { error } = await supabase.from('chats').delete().eq('id', chatId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      toast.success('Conversa excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir conversa: ${error.message}`);
    },
  });
}