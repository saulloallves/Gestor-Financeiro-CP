import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';
import { format } from 'date-fns';
import { ptBR as ptBRLocale } from 'date-fns/locale';
import {
  Search,
  Edit,
  FileText,
  MessageSquare,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hooks do sistema cache-first
import { useDataSync, useLocalData } from '../hooks/useDataSync';

// Componentes de loading
import { 
  DataSyncModal, 
  PageSkeleton, 
  RefreshButton, 
  SyncStatusChip 
} from '../components/loading';

// Tipos
import {
  type Cobranca,
  type StatusCobranca,
  type TipoCobranca,
} from '../types/cobrancas';

// Componentes existentes
import { CobrancaForm } from '../components/CobrancaForm';

const statusLabels: Record<StatusCobranca, string> = {
  pendente: 'Pendente',
  em_aberto: 'Em Aberto',
  pago: 'Pago',
  em_atraso: 'Em Atraso',
  vencido: 'Vencido',
  negociado: 'Negociado',
  parcelado: 'Parcelado',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado',
  juridico: 'Jurídico',
};

const statusColors: Record<StatusCobranca, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  pendente: 'default',
  em_aberto: 'primary',
  pago: 'success',
  em_atraso: 'warning',
  vencido: 'error',
  negociado: 'info',
  parcelado: 'secondary',
  cancelado: 'default',
  atrasado: 'warning',
  juridico: 'error',
};

const tipoLabels: Record<TipoCobranca, string> = {
  royalties: 'Royalties',
  insumos: 'Insumos',
  aluguel: 'Aluguel',
  eventual: 'Eventual',
};

export function CobrancasPageCacheFirst() {
  const theme = useTheme();
  
  // Estado local para filtros e UI
  const [cobrancaParaEditar, setCobrancaParaEditar] = useState<Cobranca | undefined>();
  const [formAberto, setFormAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusCobranca | ''>('');
  const [tipoFilter, setTipoFilter] = useState<TipoCobranca | ''>('');
  const [codigoUnidadeFilter, setCodigoUnidadeFilter] = useState('');

  // Hooks do sistema cache-first
  const { 
    isLoading, 
    hasInitialLoad, 
    error, 
    progress
  } = useDataSync();
  
  const { 
    cobrancas, 
    estatisticas
  } = useLocalData();

  // Dados filtrados localmente (muito mais rápido que React Query)
  const cobrancasFiltradas = useMemo(() => {
    let resultado = [...cobrancas];

    // Filtro por termo de busca
    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(c => 
        c.observacoes?.toLowerCase().includes(termo) ||
        c.codigo_unidade.toString().includes(termo) ||
        c.id.toLowerCase().includes(termo)
      );
    }

    // Filtro por status
    if (statusFilter) {
      resultado = resultado.filter(c => c.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter) {
      resultado = resultado.filter(c => c.tipo_cobranca === tipoFilter);
    }

    // Filtro por código da unidade
    if (codigoUnidadeFilter) {
      const codigo = parseInt(codigoUnidadeFilter);
      if (!isNaN(codigo)) {
        resultado = resultado.filter(c => c.codigo_unidade === codigo);
      }
    }

    return resultado;
  }, [cobrancas, searchTerm, statusFilter, tipoFilter, codigoUnidadeFilter]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSearch = () => {
    // Forçar re-render com novos filtros
    // A filtragem é instantânea pois usa dados locais
    toast.success('Filtros aplicados!');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTipoFilter('');
    setCodigoUnidadeFilter('');
  };

  const handleEdit = (cobranca: Cobranca) => {
    setCobrancaParaEditar(cobranca);
    setFormAberto(true);
  };

  const handleCloseForm = () => {
    setFormAberto(false);
    setCobrancaParaEditar(undefined);
  };

  // Configuração das colunas do DataGrid
  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Código',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
          #{params.value?.slice(-8) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'tipo_cobranca',
      headerName: 'Tipo',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={tipoLabels[params.value as TipoCobranca]}
          size="small"
          variant="outlined"
          sx={{
            borderColor: 'primary.main',
            color: 'primary.main',
            fontWeight: 500,
          }}
        />
      ),
    },
    {
      field: 'codigo_unidade',
      headerName: 'Código Unidade',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'valor_atualizado',
      headerName: 'Valor',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'vencimento',
      headerName: 'Vencimento',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {format(new Date(params.value), 'dd/MM/yyyy', { locale: ptBRLocale })}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={statusLabels[params.value as StatusCobranca]}
          size="small"
          color={statusColors[params.value as StatusCobranca]}
          variant="filled"
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      flex: 0.6,
      minWidth: 120,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit size={16} />}
          label="Editar"
          onClick={() => handleEdit(params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="boleto"
          icon={<FileText size={16} />}
          label="Boleto"
          onClick={() => console.log('Gerar boleto:', params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="negociar"
          icon={<MessageSquare size={16} />}
          label="Negociar"
          onClick={() => console.log('Negociar:', params.row)}
          showInMenu
        />,
      ],
    },
  ];

  // Se não carregou ainda ou está carregando dados iniciais, mostrar skeleton
  if (!hasInitialLoad || (isLoading && cobrancas.length === 0)) {
    return (
      <>
        <PageSkeleton
          title="Carregando Cobranças..."
          showStats
          showFilters
          tableProps={{ 
            rows: 8, 
            columns: 6, 
            showActions: true 
          }}
        />
        <DataSyncModal open={isLoading} />
      </>
    );
  }

  // Se há erro, mostrar modal de erro
  if (error) {
    return (
      <>
        <PageSkeleton
          title="Erro ao Carregar Dados"
          showStats={false}
          showFilters={false}
        />
        <DataSyncModal open={!!error} showCloseButton />
      </>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        padding: theme.spacing(3),
      }}
    >
      {/* Header da página com status de sincronização */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Gestão de Cobranças
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Sistema Cache-First - Dados sincronizados localmente
            </Typography>
            <SyncStatusChip />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <RefreshButton 
            variant="button" 
            showLastSync 
            force 
          />
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setFormAberto(true)}
            sx={{ borderRadius: 2, fontWeight: 500 }}
          >
            Nova Cobrança
          </Button>
        </Box>
      </Box>

      {/* Cards de estatísticas (calculados localmente) */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 2,
        mb: 3
      }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total de Cobranças
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {estatisticas.totalCobrancas}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'warning.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Em Aberto
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {formatCurrency(estatisticas.valorTotalEmAberto)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Vencidas
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {estatisticas.cobrancasVencidas}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  backgroundColor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle size={24} color="white" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pagas
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {estatisticas.cobrancasPagas}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Filtros */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <TextField
              placeholder="Buscar cobranças..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <Search size={16} style={{ marginRight: 8 }} />,
              }}
              sx={{
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusCobranca)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos os status</MenuItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Tipo"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoCobranca)}
              size="small"
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos os tipos</MenuItem>
              {Object.entries(tipoLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Código da Unidade"
              value={codigoUnidadeFilter}
              onChange={(e) => setCodigoUnidadeFilter(e.target.value)}
              placeholder="Ex: 1116"
              size="small"
              type="number"
              sx={{ minWidth: 150 }}
            />

            <Button
              variant="contained"
              startIcon={<Search size={16} />}
              onClick={handleSearch}
              sx={{ borderRadius: 2, fontWeight: 500 }}
            >
              Buscar
            </Button>

            <Button
              variant="outlined"
              onClick={handleClearFilters}
              sx={{ borderRadius: 2 }}
            >
              Limpar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tabela principal - dados instantâneos do cache local */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <DataGrid
          rows={cobrancasFiltradas}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 10 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          checkboxSelection
          disableRowSelectionOnClick
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: theme.palette.grey[50],
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
          }}
        />
      </Card>

      {/* Formulário de Cobrança */}
      <CobrancaForm
        open={formAberto}
        onClose={handleCloseForm}
        cobranca={cobrancaParaEditar}
      />

      {/* Modal de sincronização (aparece apenas quando necessário) */}
      <DataSyncModal 
        open={isLoading && progress !== null} 
      />
    </Box>
  );
}