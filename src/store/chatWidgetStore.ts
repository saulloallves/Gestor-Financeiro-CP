import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChatMessage } from '../types/ia';

interface ChatWidgetState {
  isOpen: boolean;
  messages: ChatMessage[];
  chatId: string | null;
  isLoading: boolean;
  toggleWidget: () => void;
  openWidget: () => void;
  closeWidget: () => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setChatId: (id: string | null) => void;
  startLoading: () => void;
  stopLoading: () => void;
  clearConversation: () => void;
}

export const useChatWidgetStore = create<ChatWidgetState>()(
  immer((set) => ({
    isOpen: false,
    messages: [],
    chatId: null,
    isLoading: false,
    toggleWidget: () => set((state) => { state.isOpen = !state.isOpen; }),
    openWidget: () => set((state) => { state.isOpen = true; }),
    closeWidget: () => set((state) => { state.isOpen = false; }),
    addMessage: (message) => set((state) => { state.messages.push(message); }),
    setMessages: (messages) => set((state) => { state.messages = messages; }),
    setChatId: (id) => set((state) => { state.chatId = id; }),
    startLoading: () => set((state) => { state.isLoading = true; }),
    stopLoading: () => set((state) => { state.isLoading = false; }),
    clearConversation: () => set((state) => {
      state.messages = [];
      state.chatId = null;
    }),
  }))
);