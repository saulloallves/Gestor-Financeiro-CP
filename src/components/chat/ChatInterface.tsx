import { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  Button,
} from '@mui/material';
import { Send, BrainCircuit, User, PlusCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { usePerfil } from '../../hooks/usePerfil';
import { LinkifiedText } from '../ui/LinkifiedText';
import { ChatWelcomeScreen } from '../ChatWelcomeScreen';
import type { ChatMessage } from '../../types/ia';
import cabecaIcon from '../../assets/cabeca.png';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  onNewChat?: () => void;
  showWelcomeScreen?: boolean;
  onSuggestionClick?: (suggestion: string) => void;
  input: string;
  setInput: (value: string) => void;
  welcomeScreenVariant?: 'page' | 'widget';
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  onNewChat,
  showWelcomeScreen = false,
  onSuggestionClick = () => {},
  input,
  setInput,
  welcomeScreenVariant = 'page',
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { usuario } = useAuthStore();
  const { data: perfilData } = usePerfil();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {onNewChat && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Chat com IA</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlusCircle size={16} />}
            onClick={onNewChat}
          >
            Nova Conversa
          </Button>
        </Box>
      )}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {showWelcomeScreen ? (
          <ChatWelcomeScreen onSuggestionClick={onSuggestionClick} variant={welcomeScreenVariant} />
        ) : (
          messages.map((message, index) => (
            <Box
              key={message.id || index}
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
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>
      <Box sx={{ p: 2, pt: 0, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.25 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Digite sua pergunta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <IconButton color="primary" onClick={handleSendMessage} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : <Send />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}