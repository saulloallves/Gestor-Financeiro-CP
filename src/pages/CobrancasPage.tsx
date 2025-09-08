import { useState } from 'react';
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
  Download,
  X,
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useCobrancas,
  useEstatisticasCobrancas,
  useAtualizarValoresCobrancas,
  useGerarBoletoAsaas,
  useSincronizarStatusAsaas,
} from '../hooks/useCobrancas';
import { useUnidades } from '../hooks/useUnidades';
import {
  type Cobranca,
  type StatusCobranca,
  type TipoCobranca,
  type CobrancasFilters,
} from '../types/cobrancas';
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

export function CobrancasPage() {
  const theme = useTheme();
  const [filters, setFilters] = useState<CobrancasFilters>({});
  const [cobrancaParaEditar, setCobrancaParaEditar] = useState<Cobranca | undefined>();
  const [formAberto, setFormAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusCobranca | ''>('');
  const [tipoFilter, setTipoFilter] = useState<TipoCobranca | ''>('');
  const [unidadeFilter, setUnidadeFilter] = useState('');
  const [isExporting] = useState(false);

  const { data: cobrancas = [], isLoading, refetch } = useCobrancas(filters);
  const { data: estatisticas } = useEstatisticasCobrancas();
  const { data: unidades } = useUnidades();
  const atualizarValores = useAtualizarValoresCobrancas();
  const gerarBoleto = useGerarBoletoAsaas();
  const sincronizarStatus = useSincronizarStatusAsaas();

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'R$ 0,00';
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return format(date, 'dd/MM/yyyy', { locale: ptBRLocale });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const handleAtualizarValores = async () => {
    try {
      await atualizarValores.mutateAsync();
      refetch();
      toast.success('Valores atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar valores:', error);
      toast.error('Erro ao atualizar valores');
    }
  };

  const handleEditarCobranca = (cobranca: Cobranca) => {
    setCobrancaParaEditar(cobranca);
    setFormAberto(true);
  };

  const handleFecharForm = () => {
    setFormAberto(false);
    setCobrancaParaEditar(undefined);
  };

  const handleGerarBoleto = async (cobrancaId: string) => {
    try {
      const result = await gerarBoleto.mutateAsync(cobrancaId);
      if (result.boleto_url) {
        window.open(result.boleto_url, '_blank');
      }
    } catch (error) {
      console.error('Erro ao gerar boleto:', error);
    }
  };

  const handleNegociar = () => {
    toast.success('Funcionalidade de negociação será implementada');
  };

  const handleSincronizarStatus = async (cobrancaId: string) => {
    try {
      await sincronizarStatus.mutateAsync(cobrancaId);
      refetch();
    } catch (error) {
      console.error('Erro ao sincronizar status:', error);
    }
  };

  const handleExport = () => {
    toast.success('Exportação será implementada');
  };

  const handleSearch = () => {
    const newFilters = {
      ...filters,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      tipo_cobranca: tipoFilter || undefined,
      unidade_id: unidadeFilter || undefined,
    };
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTipoFilter('');
    setUnidadeFilter('');
    setFilters({});
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Código',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
          #{params.value?.slice(-8) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'observacoes',
      headerName: 'Descrição',
      width: 250,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'tipo_cobranca',
      headerName: 'Tipo',
      width: 130,
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
      field: 'unidade',
      headerName: 'Unidade',
      width: 200,
      valueGetter: (_value, row: Cobranca) => row.unidade?.nome_padrao || '-',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'valor_atualizado',
      headerName: 'Valor',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: 'vencimento',
      headerName: 'Vencimento',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {formatDate(params.value)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
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
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit size={16} />}
          label="Editar"
          onClick={() => handleEditarCobranca(params.row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="boleto"
          icon={<FileText size={16} />}
          label="Gerar Boleto"
          onClick={() => handleGerarBoleto(params.row.id)}
          showInMenu
        />,
        <GridActionsCellItem
          key="sync"
          icon={<RefreshCw size={16} />}
          label="Sincronizar Status"
          onClick={() => handleSincronizarStatus(params.row.id)}
          showInMenu
        />,
        <GridActionsCellItem
          key="negociar"
          icon={<MessageSquare size={16} />}
          label="Negociar"
          onClick={() => handleNegociar()}
          showInMenu
        />,
      ],
    },
  ];

  const unidadesList = unidades?.data || [];

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      {/* Header */}
      <Box sx={{ marginBottom: theme.spacing(4) }}>
        <Typography variant="h4" component="h1" sx={{ color: 'text.primary', fontWeight: 600, marginBottom: 1 }}>
          Gestão de Cobranças
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Gerencie todas as cobranças da sua rede de franquias
        </Typography>
      </Box>

      {/* Filtros */}
      <Card sx={{ marginBottom: theme.spacing(3) }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
            <Search color={theme.palette.primary.main} />
            <Box>
              <Typography variant="h6" sx={{ color: 'text.primary', marginBottom: 0.5 }}>
                Filtrar Cobranças
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Use os filtros abaixo para encontrar cobranças específicas
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Pesquisar"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Código, descrição..."
              sx={{ minWidth: 200 }}
            />

            <TextField
              select
              label="Status"
              variant="outlined"
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusCobranca | '')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Tipo"
              variant="outlined"
              size="small"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoCobranca | '')}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(tipoLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Unidade"
              variant="outlined"
              size="small"
              value={unidadeFilter}
              onChange={(e) => setUnidadeFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {unidadesList.map((unidade) => (
                <MenuItem key={unidade.id} value={unidade.id}>
                  {unidade.nome_padrao}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              onClick={handleSearch}
              startIcon={<Search size={16} />}
              sx={{ minWidth: 120 }}
            >
              Filtrar
            </Button>

            <Button
              variant="outlined"
              onClick={handleClearFilters}
              startIcon={<X size={16} />}
            >
              Limpar
            </Button>

            <Button
              variant="outlined"
              onClick={handleAtualizarValores}
              startIcon={<RefreshCw size={16} />}
              disabled={atualizarValores.isPending}
            >
              Atualizar Valores
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, marginBottom: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  {estatisticas?.totalCobrancas || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total de Cobranças
                </Typography>
              </Box>
              <DollarSign size={24} color={theme.palette.primary.main} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 600 }}>
                  {formatCurrency(estatisticas?.cobrancasPagas || 0)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Valor Pago
                </Typography>
              </Box>
              <CheckCircle size={24} color={theme.palette.success.main} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 600 }}>
                  {formatCurrency(estatisticas?.valorTotalEmAberto || 0)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Valor Pendente
                </Typography>
              </Box>
              <Clock size={24} color={theme.palette.warning.main} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 600 }}>
                  {formatCurrency(estatisticas?.valorTotalVencido || 0)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Valor Vencido
                </Typography>
              </Box>
              <AlertTriangle size={24} color={theme.palette.error.main} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Ações */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.primary' }}>
          Lista de Cobranças ({cobrancas.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={handleExport}
            disabled={isExporting}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setFormAberto(true)}
          >
            Nova Cobrança
          </Button>
        </Box>
      </Box>

      {/* Tabela */}
      <Card>
        <DataGrid
          rows={cobrancas}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'grey.50',
              borderColor: 'divider',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Card>

      {/* Modal do Formulário */}
      <CobrancaForm
        open={formAberto}
        onClose={handleFecharForm}
        cobranca={cobrancaParaEditar}
      />
    </Box>
  );
}