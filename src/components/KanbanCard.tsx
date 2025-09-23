import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { DollarSign, Calendar, Building } from 'lucide-react';
import type { KanbanTask } from '../types/kanban';
import { format } from 'date-fns';

interface KanbanCardProps {
  task: KanbanTask;
  index: number;
}

export function KanbanCard({ task, index }: KanbanCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            boxShadow: snapshot.isDragging ? 3 : 1,
            borderLeft: `4px solid`,
            borderColor: 'primary.main',
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {task.observacoes || `Cobrança ${task.tipo_cobranca}`}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Building size={14} />
              <Typography variant="body2">Unidade: {task.codigo_unidade}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <DollarSign size={14} />
              <Typography variant="body2">{formatCurrency(task.valor_atualizado)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={14} />
              <Typography variant="body2">Venc: {formatDate(task.vencimento)}</Typography>
            </Box>
            <Chip label={task.tipo_cobranca} size="small" sx={{ mt: 1.5 }} />
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}