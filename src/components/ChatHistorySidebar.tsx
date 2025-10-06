import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useChatHistory, useDeleteChat } from '../hooks/useChatHistory';

interface ChatHistorySidebarProps {
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({ activeChatId, onSelectChat, onNewChat }: ChatHistorySidebarProps) {
  const { data: chats, isLoading } = useChatHistory();
  const deleteChatMutation = useDeleteChat();

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // Impede que o clique selecione o chat antes de excluir
    if (window.confirm('Tem certeza que deseja excluir esta conversa?')) {
      deleteChatMutation.mutate(chatId);
    }
  };

  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PlusCircle />}
          onClick={onNewChat}
        >
          Nova Conversa
        </Button>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {chats?.map((chat) => (
              <ListItem key={chat.id} disablePadding secondaryAction={
                <Tooltip title="Excluir conversa">
                  <IconButton edge="end" onClick={(e) => handleDelete(e, chat.id)}>
                    <Trash2 size={16} />
                  </IconButton>
                </Tooltip>
              }>
                <ListItemButton
                  selected={activeChatId === chat.id}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <ListItemText
                    primary={chat.title}
                    secondary={new Date(chat.created_at).toLocaleDateString('pt-BR')}
                    primaryTypographyProps={{ noWrap: true, variant: 'body2' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}