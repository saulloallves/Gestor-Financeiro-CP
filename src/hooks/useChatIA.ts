import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { iaConnectorService } from '../api/iaConnectorService';
import type { ChatMessage } from '../types/ia';
import toast from 'react-hot-toast';

export function useChatIA() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: async (prompt: string) => {
      // Adicionar mensagem do usuário imediatamente
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: prompt,
      };
      setMessages(prev => [...prev, userMessage]);

      // Chamar o serviço da IA
      return iaConnectorService.gerarResposta(prompt);
    },
    onSuccess: (response) => {
      // Adicionar resposta da IA
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao comunicar com a IA: ${errorMessage}`);
      
      // Adicionar mensagem de erro ao chat
      const errorMessageObject: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Ocorreu um erro: ${errorMessage}`,
      };
      setMessages(prev => [...prev, errorMessageObject]);
    },
  });

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    sendMessage,
    isLoading,
    clearChat,
  };
}