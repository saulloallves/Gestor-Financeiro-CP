import { Droppable } from '@hello-pangea/dnd';
import { Box, Typography, Paper } from '@mui/material';
import type { KanbanColumnData } from '../types/kanban';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: KanbanColumnData;
}

export function KanbanColumn({ column }: KanbanColumnProps) {
  return (
    <Paper
      sx={{
        width: 300,
        minWidth: 300,
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {column.title} ({column.tasks.length})
        </Typography>
      </Box>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flexGrow: 1,
              p: 2,
              overflowY: 'auto',
              backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              transition: 'background-color 0.2s ease',
            }}
          >
            {column.tasks.map((task, index) => (
              <KanbanCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
}