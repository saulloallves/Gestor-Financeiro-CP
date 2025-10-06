import { useState } from 'react';
import { Box, Paper } from '@mui/material';
import { useChatIA } from '../hooks/useChatIA';
import { useChatMessages } from '../hooks/useChatHistory';
import { ChatHistorySidebar } from '../components/ChatHistorySidebar';
import { ChatInterface } from '../components/chat/ChatInterface';

export function ChatIAPage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const { data: messages = [], isLoading: isLoadingMessages } = useChatMessages(activeChatId);
  const { sendMessage, isLoading: isSendingMessage } = useChatIA(setActiveChatId);

  const handleSendMessage = (prompt: string) => {
    sendMessage({ prompt, chatId: activeChatId });
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ prompt: suggestion, chatId: null });
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', p: 2, gap: 2 }}>
      <Paper elevation={3} sx={{ display: 'flex', flex: 1, overflow: 'hidden', borderRadius: 2 }}>
        <ChatHistorySidebar
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
        />
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isSendingMessage || isLoadingMessages}
          showWelcomeScreen={!activeChatId && messages.length === 0}
          onSuggestionClick={handleSuggestionClick}
          input={input}
          setInput={setInput}
        />
      </Paper>
    </Box>
  );
}