// Página de Listagem de Unidades - Módulo 2.1
// Seguindo as diretrizes de design e arquitetura do projeto

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Paper,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  Building2,
  Phone,
  MapPin,
  X
} from 'lucide-react';
import { useUnidadesPage } from '../hooks/useUnidades';
import { UnidadeForm } from '../components/UnidadeForm';
import { getStatusLabel, getStatusColor } from '../utils/statusMask';
import type { Unidade, StatusUnidade } from '../types/unidades';

export function UnidadesPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusUnidade | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados do modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);

  // Handlers do modal
  const handleCreateUnidade = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditUnidade = (unidade: Unidade) => {
    setSelectedUnidade(unidade);
    setIsEditModalOpen(true);
  };

  const handleViewUnidade = (unidade: Unidade) => {
    // Por enquanto, vamos abrir o modal de edição em modo visualização
    setSelectedUnidade(unidade);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUnidade(null);
  };

  const {
    unidades,
    totalUnidades,
    isLoading,
    isError,
    isExporting,
    filters,
    handleFilterChange,
    handleExport,
    refetch
  } = useUnidadesPage();

  // Função para aplicar filtros de busca
  const handleSearch = () => {
    const newFilters = {
      ...filters,
      nome_padrao: searchTerm || undefined,
      status: statusFilter ? [statusFilter] : undefined,
    };
    handleFilterChange(newFilters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    handleFilterChange({});
  };

  // Definir colunas da tabela
  const columns: GridColDef[] = [
    {
      field: 'codigo_unidade',
      headerName: 'Código',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          sx={{ 
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 'bold'
          }} 
        />
      ),
    },
    {
      field: 'nome_padrao',
      headerName: 'Nome da Unidade',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Building2 size={16} color={theme.palette.primary.main} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'cnpj',
      headerName: 'CNPJ',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const status = params.value as StatusUnidade;
        return (
          <Chip
            label={getStatusLabel(status)}
            color={getStatusColor(status)}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'telefone_comercial',
      headerName: 'Telefone',
      width: 140,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value && <Phone size={14} color={theme.palette.text.secondary} />}
          <Typography variant="body2" color="text.secondary">
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'endereco_cidade',
      headerName: 'Cidade',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {params.value && <MapPin size={14} color={theme.palette.text.secondary} />}
          <Typography variant="body2" color="text.secondary">
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'endereco_uf',
      headerName: 'UF',
      width: 60,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={
            <Tooltip title="Visualizar">
              <Eye size={16} />
            </Tooltip>
          }
          label="Visualizar"
          onClick={() => handleViewUnidade(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={
            <Tooltip title="Editar">
              <Edit size={16} />
            </Tooltip>
          }
          label="Editar"
          onClick={() => handleEditUnidade(params.row)}
        />,
      ],
    },
  ];

  if (isError) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          Erro ao carregar unidades
        </Typography>
        <Button 
          onClick={() => refetch()} 
          sx={{ mt: 2 }}
          variant="outlined"
        >
          Tentar novamente
        </Button>
      </Card>
    );
  }

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      {/* Cabeçalho */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: theme.spacing(3)
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Cadastro de Unidades
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Gerencie todas as unidades franqueadas da rede
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download size={20} />}
            onClick={handleExport}
            disabled={isExporting}
            sx={{ minWidth: 140 }}
          >
            {isExporting ? <CircularProgress size={20} /> : 'Exportar'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleCreateUnidade}
            sx={{ minWidth: 160 }}
          >
            Nova Unidade
          </Button>
        </Box>
      </Box>

      {/* Filtros e Busca */}
      <Card sx={{ marginBottom: theme.spacing(3) }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Buscar por nome da unidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search size={20} color={theme.palette.text.secondary} />,
              }}
              size="small"
              sx={{ flex: '1 1 300px' }}
            />
            
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusUnidade | '')}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos os status</MenuItem>
              <MenuItem value="ativo">Ativo</MenuItem>
              <MenuItem value="em_implantacao">Em Implantação</MenuItem>
              <MenuItem value="suspenso">Suspenso</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </TextField>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Search size={16} />}
                onClick={handleSearch}
                size="small"
              >
                Buscar
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                size="small"
              >
                Limpar
              </Button>
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                sx={{ 
                  border: 1, 
                  borderColor: 'divider',
                  backgroundColor: showFilters ? 'primary.main' : 'transparent',
                  color: showFilters ? 'primary.contrastText' : 'text.secondary'
                }}
                size="small"
              >
                <Filter size={16} />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 2, 
        marginBottom: theme.spacing(3) 
      }}>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.light' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.dark' }}>
            {totalUnidades}
          </Typography>
          <Typography variant="body2" color="primary.dark">
            Total de Unidades
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.light' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
            {unidades.filter(u => u.status === 'ativo').length}
          </Typography>
          <Typography variant="body2" color="success.dark">
            Ativas
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.light' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.dark' }}>
            {unidades.filter(u => u.status === 'em_implantacao').length}
          </Typography>
          <Typography variant="body2" color="warning.dark">
            Em Implantação
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'error.light' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.dark' }}>
            {unidades.filter(u => u.status === 'cancelado').length}
          </Typography>
          <Typography variant="body2" color="error.dark">
            Canceladas
          </Typography>
        </Paper>
      </Box>

      {/* Tabela de Unidades */}
      <Card>
        <DataGrid
          rows={unidades}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 20 },
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'background.default',
              borderColor: 'divider',
            },
          }}
          disableRowSelectionOnClick
          autoHeight
        />
      </Card>

      {/* Modal de Criar Unidade */}
      <Dialog
        open={isCreateModalOpen}
        onClose={handleCloseModals}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Nova Unidade
          </Typography>
          <IconButton onClick={handleCloseModals} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <UnidadeForm
            onSuccess={handleCloseModals}
            onCancel={handleCloseModals}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Unidade */}
      <Dialog
        open={isEditModalOpen}
        onClose={handleCloseModals}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Editar Unidade
          </Typography>
          <IconButton onClick={handleCloseModals} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <UnidadeForm
            unidade={selectedUnidade || undefined}
            onSuccess={handleCloseModals}
            onCancel={handleCloseModals}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
