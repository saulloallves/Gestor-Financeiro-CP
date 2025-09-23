import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanService } from '../api/kanbanService';
import type { KanbanBoardData, KanbanStatus } from '../types/kanban';
import type { DropResult } from '@hello-pangea/dnd';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useKanban = () => {
  const queryClient = useQueryClient();
  const [boardData, setBoardData] = useState<KanbanBoardData | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['kanbanData'],
    queryFn: () => kanbanService.getKanbanData(),
  });

  useEffect(() => {
    if (data) {
      setBoardData(data);
    }
  }, [data]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ cobrancaId, novoStatus }: { cobrancaId: string; novoStatus: KanbanStatus }) =>
      kanbanService.updateCobrancaStatus(cobrancaId, novoStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanData'] });
      toast.success('Status da cobrança atualizado!');
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar: ${err.message}`);
      // Reverter o estado otimista se a mutação falhar
      queryClient.invalidateQueries({ queryKey: ['kanbanData'] });
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !boardData) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = boardData.columns[source.droppableId as KanbanStatus];
    const endColumn = boardData.columns[destination.droppableId as KanbanStatus];
    const task = startColumn.tasks.find(t => t.id === draggableId);

    if (!task) return;

    // Atualização otimista da UI
    const newStartTasks = Array.from(startColumn.tasks);
    newStartTasks.splice(source.index, 1);

    const newEndTasks = Array.from(endColumn.tasks);
    newEndTasks.splice(destination.index, 0, task);

    const newBoardData = {
      ...boardData,
      columns: {
        ...boardData.columns,
        [startColumn.id]: {
          ...startColumn,
          tasks: newStartTasks,
        },
        [endColumn.id]: {
          ...endColumn,
          tasks: newEndTasks,
        },
      },
    };
    setBoardData(newBoardData);

    // Chamar a mutação para atualizar no backend
    updateStatusMutation.mutate({
      cobrancaId: draggableId,
      novoStatus: destination.droppableId as KanbanStatus,
    });
  };

  return {
    boardData,
    isLoading,
    error,
    onDragEnd,
  };
};