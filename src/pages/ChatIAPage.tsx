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
import { Send, BrainCircuit, User, RefreshCcw } from 'lucide-react';
import { useChatIA } from '../hooks/useChatIA';
import { useAuthStore } from '../store/authStore';
import { usePerfil } from '../hooks/usePerfil'; // Importar o hook de perfil
import cabecaIcon from '../assets/cabeca.png';

export function ChatIAPage() {
  const { messages, sendMessage, isLoading, clearChat } = useChatIA();
  const { usuario } = useAuthStore();
  const { data: perfilData } = usePerfil(); // Buscar dados do perfil do usuário
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Chat com Agente IA
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderRadius: 2
        }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
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
                  <Avatar src={cabecaIcon} sx={{ bgcolor: 'transparent' }}>
                    <BrainCircuit />
                  </Avatar>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                    color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </Paper>
                {message.role === 'user' && (
                  <Avatar 
                    src={perfilData?.fotoPerfil || undefined} 
                    sx={{ bgcolor: 'secondary.main' }}
                  >
                    {!perfilData?.fotoPerfil && (usuario?.nome?.charAt(0) || <User />)}
                  </Avatar>
                )}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
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
              disabled={isLoading}
            />
            <IconButton color="primary" onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? <CircularProgress size={24} /> : <Send />}
            </IconButton>
            <IconButton onClick={clearChat} disabled={isLoading}>
              <RefreshCcw />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}