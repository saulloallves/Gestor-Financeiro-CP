// Página de Listagem de Franqueados - Módulo 2.2
// Seguindo as diretrizes de design e arquitetura do projeto

import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton,
  Chip, TextField, MenuItem, Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { DataGrid, type GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';
import { useTheme } from '@mui/material/styles';
import {
  Plus, Search, Filter, Download, Edit,
  User, Phone, MapPin, X, Users,
  CheckCircle, XCircle, Crown, Heart, DollarSign, Handshake
} from 'lucide-react';
import { useFranqueadosPage } from '../hooks/useFranqueados';
import { FranqueadoForm } from '../components/FranqueadoForm';
import { 
  getTipoFranqueadoLabel, 
  getTipoFranqueadoColor,
  getStatusFranqueadoLabel, 
  getStatusFranqueadoColor,
  formatarProlabore,
  formatarUnidadesVinculadas
} from '../utils/franqueadosMask';
import type { Franqueado, StatusFranqueado, TipoFranqueado } from '../types/franqueados';

export function FranqueadosPage() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFranqueado | ''>('');
  const [tipoFilter, setTipoFilter] = useState<TipoFranqueado | ''>('');
  
  // Estados do modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFranqueado, setSelectedFranqueado] = useState<Franqueado | null>(null);

  // Handlers do modal
  const handleCreateFranqueado = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditFranqueado = (franqueado: Franqueado) => {
    setSelectedFranqueado(franqueado);
    setIsEditModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedFranqueado(null);
  };

  const {
    franqueados,
    totalFranqueados,
    isLoading,
    isError,
    isExporting,
    filters,
    handleFilterChange,
    handleExport,
    refetch
  } = useFranqueadosPage();

  // Função para aplicar filtros de busca
  const handleSearch = () => {
    const newFilters = {
      ...filters,
      nome: searchTerm || undefined,
      status: statusFilter ? [statusFilter] : undefined,
      tipo: tipoFilter ? [tipoFilter] : undefined,
    };
    handleFilterChange(newFilters);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTipoFilter('');
    handleFilterChange({});
  };

  // Definir colunas da tabela
  const columns: GridColDef[] = [
    {
      field: 'nome',
      headerName: 'Nome',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <User size={16} color={theme.palette.primary.main} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'cpf',
      headerName: 'CPF',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        const tipo = params.value as TipoFranqueado;
        const icon = tipo === 'principal' ? <Crown size={14} /> :
                    tipo === 'familiar' ? <Heart size={14} /> :
                    tipo === 'investidor' ? <DollarSign size={14} /> :
                    <Handshake size={14} />;
        
        return (
          <Chip
            icon={icon}
            label={getTipoFranqueadoLabel(tipo)}
            color={getTipoFranqueadoColor(tipo)}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => {
        const status = params.value as StatusFranqueado;
        return (
          <Chip
            label={getStatusFranqueadoLabel(status)}
            color={getStatusFranqueadoColor(status)}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'telefone',
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
      field: 'prolabore',
      headerName: 'Pró-labore',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
          {formatarProlabore(params.value)}
        </Typography>
      ),
    },
    {
      field: 'unidades_vinculadas',
      headerName: 'Unidades',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
          {formatarUnidadesVinculadas(params.value)}
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
          onClick={() => handleEditFranqueado(params.row)}
        />,
      ],
    },
  ];

  if (isError) {
    return (
      <Card sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          Erro ao carregar franqueados
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
            Cadastro de Franqueados
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Gerencie todos os franqueados da rede Cresci e Perdi
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
            onClick={handleCreateFranqueado}
            sx={{ minWidth: 160 }}
          >
            Novo Franqueado
          </Button>
        </Box>
      </Box>

      {/* Filtros e Busca */}
      <Card sx={{ 
        marginBottom: theme.spacing(3), 
        width: '100%',
        borderRadius: 3,
        backgroundColor: 'background.paper',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '6px solid',
        borderLeftColor: 'primary.main',
      }}>
        <CardContent sx={{ p: 3 }}>
          {/* Cabeçalho da seção de filtros */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 3 
          }}>
            <Box sx={{ 
              backgroundColor: 'primary.main', 
              borderRadius: 3, 
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Filter size={24} color="white" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary',
                mb: 0.5
              }}>
                Filtros de Pesquisa
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Use os filtros para encontrar franqueados específicos
              </Typography>
            </Box>
          </Box>

          {/* Campos de filtro */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexWrap: 'wrap', 
            alignItems: 'flex-end' 
          }}>
            <TextField
              placeholder="Buscar por nome do franqueado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ marginRight: 1, display: 'flex', alignItems: 'center' }}>
                    <Search size={20} color={theme.palette.text.secondary} />
                  </Box>
                ),
              }}
              size="small"
              sx={{ 
                flex: '1 1 300px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFranqueado | '')}
              size="small"
              sx={{ 
                minWidth: 120,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            >
              <MenuItem value="">Todos os status</MenuItem>
              <MenuItem value="ativo">Ativo</MenuItem>
              <MenuItem value="inativo">Inativo</MenuItem>
            </TextField>

            <TextField
              select
              label="Tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoFranqueado | '')}
              size="small"
              sx={{ 
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            >
              <MenuItem value="">Todos os tipos</MenuItem>
              <MenuItem value="principal">Principal</MenuItem>
              <MenuItem value="familiar">Sócio Familiar</MenuItem>
              <MenuItem value="investidor">Investidor</MenuItem>
              <MenuItem value="parceiro">Parceiro</MenuItem>
            </TextField>

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<Search size={16} />}
                onClick={handleSearch}
                size="medium"
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                Buscar
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                size="medium"
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 500,
                  textTransform: 'none'
                }}
              >
                Limpar
              </Button>
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
        {/* Total de Franqueados */}
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
                {totalFranqueados}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Total de Franqueados
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
              <Users size={32} color="#667eea" />
            </Box>
          </Box>
        </Card>

        {/* Franqueados Ativos */}
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
                {franqueados.filter(f => f.status === 'ativo').length}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Ativos
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

        {/* Franqueados Principais */}
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
                {franqueados.filter(f => f.tipo === 'principal').length}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Principais
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
              <Crown size={32} color="#ffa726" />
            </Box>
          </Box>
        </Card>

        {/* Franqueados Inativos */}
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
                {franqueados.filter(f => f.status === 'inativo').length}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Inativos
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

      {/* Tabela de Franqueados */}
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
            rows={franqueados}
            columns={columns}
            loading={isLoading}
            pageSizeOptions={[10, 20, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 20 },
              },
            }}
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
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
                padding: theme.spacing(2, 1.5),
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '& .MuiTypography-root': {
                  fontSize: '1rem !important',
                },
                '& .MuiChip-root': {
                  fontSize: '0.9rem',
                },
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'background.default',
                borderColor: 'divider',
                '& .MuiDataGrid-columnHeader': {
                  padding: theme.spacing(1.5, 1.5),
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }
              },
              '& .MuiDataGrid-virtualScroller': {
                overflow: 'auto',
              },
              '& .MuiDataGrid-row': {
                minHeight: '64px !important',
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
            rowHeight={64}
          />
        </Box>
      </Card>

      {/* Modal de Criar Franqueado */}
      <Dialog
        open={isCreateModalOpen}
        onClose={handleCloseModals}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Novo Franqueado
          </Typography>
          <IconButton onClick={handleCloseModals} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FranqueadoForm
            onSuccess={handleCloseModals}
            onCancel={handleCloseModals}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Franqueado */}
      <Dialog
        open={isEditModalOpen}
        onClose={handleCloseModals}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Editar Franqueado
          </Typography>
          <IconButton onClick={handleCloseModals} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <FranqueadoForm
            franqueado={selectedFranqueado || undefined}
            onSuccess={handleCloseModals}
            onCancel={handleCloseModals}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}