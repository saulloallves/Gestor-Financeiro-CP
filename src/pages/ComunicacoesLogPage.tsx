import { useState } from 'react';
import { Box, Typography, Card, TextField, MenuItem, Chip } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useComunicacoes } from '../hooks/useComunicacoes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ComunicacoesLogPage() {
  const [filters, setFilters] = useState({});
  const { comunicacoes, isLoading } = useComunicacoes(filters);

  const columns: GridColDef[] = [
    {
      field: 'data_envio',
      headerName: 'Data',
      width: 180,
      valueFormatter: (value: string) => format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    },
    { field: 'franqueado_nome', headerName: 'Destinatário', flex: 1 },
    { field: 'unidade_codigo_unidade', headerName: 'Unidade', width: 100 },
    {
      field: 'canal',
      headerName: 'Canal',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'enviado' ? 'success' : 'default'} />,
    },
    {
      field: 'enviado_por',
      headerName: 'Enviado Por',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.row.enviado_por_ia ? 'Agente IA' : params.value}
          size="small"
          color={params.row.enviado_por_ia ? 'primary' : 'secondary'}
        />
      ),
    },
    { field: 'conteudo', headerName: 'Mensagem', flex: 2 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Histórico de Comunicações
      </Typography>
      <Card sx={{ mb: 3, p: 2 }}>
        {/* Adicionar filtros aqui no futuro */}
        <Typography>Filtros em breve...</Typography>
      </Card>
      <Paper sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={comunicacoes || []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}