import { DragDropContext } from '@hello-pangea/dnd';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useKanban } from '../hooks/useKanban';
import { KanbanColumn } from '../components/KanbanColumn';

export function KanbanPage() {
  const { boardData, isLoading, error, onDragEnd } = useKanban();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Erro ao carregar o Kanban: {error.message}</Alert>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
        Kanban de Cobranças
      </Typography>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
          }}
        >
          {boardData?.columnOrder.map(columnId => {
            const column = boardData.columns[columnId];
            if (!column) return null;
            return <KanbanColumn key={column.id} column={column} />;
          })}
        </Box>
      </DragDropContext>
    </Box>
  );
}