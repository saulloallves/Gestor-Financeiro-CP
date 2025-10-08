import { useState, useEffect } from 'react';
import { Box, Typography, Card, TextField, MenuItem, Chip, Paper, Button } from '@mui/material';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useComunicacoesCacheFirst } from '../hooks/useComunicacoesCacheFirst';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Database, Filter, Search } from 'lucide-react';

export function ComunicacoesLogPage() {
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localCanalFilter, setLocalCanalFilter] = useState<'whatsapp' | 'email' | ''>('');

  const {
    comunicacoes,
    total,
    isLoading,
    pagination,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
  } = useComunicacoesCacheFirst();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 50,
  });

  useEffect(() => {
    setPaginationModel({
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  }, [pagination.page, pagination.pageSize]);

  const handleClearFilters = () => {
    setLocalSearchTerm('');
    setLocalCanalFilter('');
    handleFilterChange('searchTerm', '');
    handleFilterChange('canal', '');
  };

  const columns: GridColDef[] = [
    {
      field: 'data_envio',
      headerName: 'Data',
      width: 180,
      valueFormatter: (value: string) => format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    },
    { field: 'franqueado_nome', headerName: 'Destinatário', flex: 1, minWidth: 150 },
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
    { field: 'conteudo', headerName: 'Mensagem', flex: 2, minWidth: 300 },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Typography variant="h4" component="h1">
          Histórico de Comunicações
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            px: 1, 
            py: 0.5, 
            backgroundColor: 'success.main',
            borderRadius: 1,
            color: 'white'
          }}
        >
          <Database size={16} />
          <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
            CACHE
          </Typography>
        </Box>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Visualize todos os envios de mensagens do sistema.
      </Typography>

      <Card sx={{ mb: 3, p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ backgroundColor: 'primary.main', borderRadius: 3, p: 1.5, display: 'flex' }}>
            <Filter size={24} color="white" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Filtros de Pesquisa</Typography>
            <Typography variant="body2" color="text.secondary">Encontre comunicações específicas</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Buscar por destinatário, unidade ou conteúdo..."
            size="small"
            value={localSearchTerm}
            onChange={(e) => {
              setLocalSearchTerm(e.target.value);
              handleFilterChange('searchTerm', e.target.value);
            }}
            sx={{ flex: '1 1 300px' }}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
            }}
          />
          <TextField
            select
            label="Canal"
            size="small"
            value={localCanalFilter}
            onChange={(e) => {
              const value = e.target.value as '' | 'whatsapp' | 'email';
              setLocalCanalFilter(value);
              handleFilterChange('canal', value);
            }}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="email">E-mail</MenuItem>
          </TextField>
          <Button variant="outlined" onClick={handleClearFilters}>
            Limpar
          </Button>
        </Box>
      </Card>

      <Paper sx={{ height: '70vh', width: '100%' }}>
        <DataGrid
          rows={comunicacoes || []}
          columns={columns}
          loading={isLoading}
          rowCount={total}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => {
            handlePageChange(model.page);
            handlePageSizeChange(model.pageSize);
          }}
          paginationMode="server"
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}