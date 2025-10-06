import { useState } from 'react';
import { Paper, Box } from '@mui/material';
import { useChatWidgetStore } from '../../store/chatWidgetStore';
import { useWidgetChatIA } from '../../hooks/useWidgetChatIA';
import { ChatInterface } from './ChatInterface';

export function ChatWidgetModal() {
  const { isOpen, messages, isLoading, chatId, clearConversation } = useChatWidgetStore();
  const { sendMessage } = useWidgetChatIA();
  const [input, setInput] = useState('');

  const handleSendMessage = (prompt: string) => {
    sendMessage({ prompt, chatId });
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ prompt: suggestion, chatId });
  };

  const handleNewChat = () => {
    clearConversation();
    setInput('');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 112,
        right: 32,
        width: 400,
        height: 500,
        zIndex: 1299,
        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
        transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          height: '100%',
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onNewChat={handleNewChat}
          showWelcomeScreen={!chatId && messages.length === 0}
          onSuggestionClick={handleSuggestionClick}
          input={input}
          setInput={setInput}
        />
      </Paper>
    </Box>
  );
}