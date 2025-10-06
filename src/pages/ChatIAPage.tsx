import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Send, BrainCircuit, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePerfil } from '../hooks/usePerfil';
import { useChatIA } from '../hooks/useChatIA';
import { useChatMessages } from '../hooks/useChatHistory';
import { ChatHistorySidebar } from '../components/ChatHistorySidebar';
import { ChatWelcomeScreen } from '../components/ChatWelcomeScreen';
import { LinkifiedText } from '../components/ui/LinkifiedText'; // Importando o novo componente
import cabecaIcon from '../assets/cabeca.png';

export function ChatIAPage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const { usuario } = useAuthStore();
  const { data: perfilData } = usePerfil();
  const { data: messages = [], isLoading: isLoadingMessages } = useChatMessages(activeChatId);
  const { sendMessage, isLoading: isSendingMessage } = useChatIA(setActiveChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && !isSendingMessage) {
      sendMessage({ prompt: input.trim(), chatId: activeChatId });
      setInput('');
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ prompt: suggestion, chatId: null });
  };

  const renderChatContent = () => {
    if (isLoadingMessages) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!activeChatId && messages.length === 0) {
      return <ChatWelcomeScreen onSuggestionClick={handleSuggestionClick} />;
    }

    return (
      <>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, maxWidth: '80%' }}>
              {message.role === 'assistant' && (
                <Avatar src={cabecaIcon} sx={{ bgcolor: 'transparent' }}><BrainCircuit /></Avatar>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  bgcolor: message.role === 'user' ? 'primary.main' : 'background.default',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  <LinkifiedText text={message.content} />
                </Typography>
              </Paper>
              {message.role === 'user' && (
                <Avatar src={perfilData?.fotoPerfil || undefined} sx={{ bgcolor: 'secondary.main' }}>
                  {!perfilData?.fotoPerfil && (usuario?.nome?.charAt(0) || <User />)}
                </Avatar>
              )}
            </Box>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', p: 2, gap: 2 }}>
      <Paper elevation={3} sx={{ display: 'flex', flex: 1, overflow: 'hidden', borderRadius: 2 }}>
        <ChatHistorySidebar
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onNewChat={handleNewChat}
        />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {renderChatContent()}
          </Box>
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Digite sua pergunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isSendingMessage}
              />
              <IconButton color="primary" onClick={handleSendMessage} disabled={isSendingMessage}>
                {isSendingMessage ? <CircularProgress size={24} /> : <Send />}
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}