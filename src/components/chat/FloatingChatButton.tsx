import { Fab, Tooltip } from '@mui/material';
import { MessageSquare } from 'lucide-react';
import { useChatWidgetStore } from '../../store/chatWidgetStore';

export function FloatingChatButton() {
  const { toggleWidget } = useChatWidgetStore();

  return (
    <Tooltip title="Chat com IA" placement="left">
      <Fab
        color="primary"
        aria-label="abrir chat"
        onClick={toggleWidget}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1300,
        }}
      >
        <MessageSquare />
      </Fab>
    </Tooltip>
  );
}