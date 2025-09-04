// Página de Listagem de Unidades - Módulo 2.1
// Seguindo as diretrizes de design e arquitetura do projeto

import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Chip, TextField, MenuItem, Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import {
  Plus, Search, Filter, Download, Edit,
  Building2, Phone, MapPin, X, Building,
  CheckCircle, Clock, XCircle
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
      flex: 0,
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
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>
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
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 130,
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
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>
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
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'center' }}>
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
      flex: 0.3,
      minWidth: 60,
      maxWidth: 80,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, textAlign: 'center', width: '100%' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      flex: 0.3,
      minWidth: 80,
      maxWidth: 100,
      getActions: (params) => [
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
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflow: 'hidden',
      padding: theme.spacing(3) 
    }}>
      {/* Cabeçalho */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2, md: 0 },
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
        
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', md: 'auto' }
        }}>
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
      <Card sx={{ marginBottom: theme.spacing(3), width: '100%' }}>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 3, 
        marginBottom: theme.spacing(3) 
      }}>
        {/* Total de Unidades */}
        <Card sx={{ 
          p: 3, 
          borderRadius: 3,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: '6px solid #667eea',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)',
            borderLeftColor: '#5a67d8',
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {totalUnidades}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Total de Unidades
              </Typography>
            </Box>
            <Box sx={{ 
              backgroundColor: 'rgba(102, 126, 234, 0.1)', 
              borderRadius: 3, 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building size={32} color="#667eea" />
            </Box>
          </Box>
        </Card>

        {/* Unidades Ativas */}
        <Card sx={{ 
          p: 3, 
          borderRadius: 3,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: '6px solid #11998e',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(17, 153, 142, 0.15)',
            borderLeftColor: '#0d7377',
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {unidades.filter(u => u.status === 'ativo').length}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Ativas
              </Typography>
            </Box>
            <Box sx={{ 
              backgroundColor: 'rgba(17, 153, 142, 0.1)', 
              borderRadius: 3, 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={32} color="#11998e" />
            </Box>
          </Box>
        </Card>

        {/* Em Implantação */}
        <Card sx={{ 
          p: 3, 
          borderRadius: 3,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: '6px solid #ffa726',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(255, 167, 38, 0.15)',
            borderLeftColor: '#ff9800',
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {unidades.filter(u => u.status === 'em_implantacao').length}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Em Implantação
              </Typography>
            </Box>
            <Box sx={{ 
              backgroundColor: 'rgba(255, 167, 38, 0.1)', 
              borderRadius: 3, 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={32} color="#ffa726" />
            </Box>
          </Box>
        </Card>

        {/* Canceladas */}
        <Card sx={{ 
          p: 3, 
          borderRadius: 3,
          backgroundColor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: '6px solid #f44336',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(244, 67, 54, 0.15)',
            borderLeftColor: '#d32f2f',
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                {unidades.filter(u => u.status === 'cancelado').length}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Canceladas
              </Typography>
            </Box>
            <Box sx={{ 
              backgroundColor: 'rgba(244, 67, 54, 0.1)', 
              borderRadius: 3, 
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <XCircle size={32} color="#f44336" />
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Tabela de Unidades */}
      <Card sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          width: '100%', 
          flexGrow: 1,
          '& .MuiDataGrid-root': {
            width: '100%',
            maxWidth: '100%',
          }
        }}>
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
              width: '100%',
              minWidth: 0,
              '& .MuiDataGrid-main': {
                minWidth: 0,
              },
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
                padding: theme.spacing(2, 1.5), // Aumenta o padding das células
                fontSize: '1rem', // Aumenta ainda mais o tamanho da fonte das células
                display: 'flex',
                alignItems: 'center', // Centraliza verticalmente
                justifyContent: 'center', // Centraliza horizontalmente
                '& .MuiTypography-root': {
                  fontSize: '1rem !important', // Força o tamanho da fonte para todos os Typography
                },
                '& .MuiChip-root': {
                  fontSize: '0.9rem', // Tamanho específico para chips
                },
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'background.default',
                borderColor: 'divider',
                '& .MuiDataGrid-columnHeader': {
                  padding: theme.spacing(1.5, 1.5), // Padding para headers
                  fontSize: '1rem', // Aumenta ainda mais o tamanho da fonte dos headers
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', // Centraliza headers
                  textAlign: 'center',
                }
              },
              '& .MuiDataGrid-virtualScroller': {
                overflow: 'auto',
              },
              '& .MuiDataGrid-row': {
                minHeight: '64px !important', // Altura mínima das linhas
                '&:hover': {
                  backgroundColor: 'action.hover',
                }
              },
              '& .MuiDataGrid-columnHeader': {
                minWidth: 0,
              },
            }}
            disableRowSelectionOnClick
            autoHeight
            hideFooterSelectedRowCount
            rowHeight={64} // Define altura fixa das linhas
          />
        </Box>
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
