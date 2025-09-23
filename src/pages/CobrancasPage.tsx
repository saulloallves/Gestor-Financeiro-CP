import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';
import { format } from 'date-fns';
import {
  Search,
  Edit,
  FileText,
  MessageSquare,
  Plus,
  Download,
  Filter,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCobrancasCacheFirst } from '../hooks/useCobrancasCacheFirst';
import { useCobrancasEstatisticasCacheFirst } from '../hooks/useCobrancasEstatisticasCacheFirst';
import {
  type Cobranca,
  type StatusCobranca,
  type TipoCobranca,
} from '../types/cobrancas';
import { CobrancaForm } from '../components/CobrancaForm';
import { UnidadeDetalhesModal } from '../components/UnidadeDetalhesModal';

const statusLabels: Record<StatusCobranca, string> = {
  pendente: 'Pendente', em_aberto: 'Em Aberto', pago: 'Pago', em_atraso: 'Em Atraso',
  vencido: 'Vencido', negociado: 'Negociado', parcelado: 'Parcelado', cancelado: 'Cancelado',
  atrasado: 'Atrasado', juridico: 'Jurídico',
};

const statusColors: Record<StatusCobranca, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  pendente: 'default', em_aberto: 'primary', pago: 'success', em_atraso: 'warning',
  vencido: 'error', negociado: 'info', parcelado: 'secondary', cancelado: 'default',
  atrasado: 'warning', juridico: 'error',
};

const tipoLabels: Record<TipoCobranca, string> = {
  royalties: 'Royalties', insumos: 'Insumos', aluguel: 'Aluguel',
  eventual: 'Eventual', taxa_franquia: 'Taxa de Franquia',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CobrancasPage() {
  const theme = useTheme();
  const [cobrancaParaEditar, setCobrancaParaEditar] = useState<Cobranca | undefined>();
  const [formAberto, setFormAberto] = useState(false);
  const [modalUnidadeOpen, setModalUnidadeOpen] = useState(false);
  const [selectedUnidadeCodigo, setSelectedUnidadeCodigo] = useState<number | null>(null);

  // Estado local para os inputs de filtro
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState<StatusCobranca | ''>('');

  const {
    cobrancas,
    total,
    isLoading,
    filters,
    pagination,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
  } = useCobrancasCacheFirst();

  const { data: estatisticas, isLoading: isLoadingStats } = useCobrancasEstatisticasCacheFirst();

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  useEffect(() => {
    setPaginationModel({
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
  }, [pagination.page, pagination.pageSize]);

  const handleSearch = () => {
    handleFilterChange({
      ...filters,
      search: localSearchTerm || undefined,
      status: localStatusFilter || undefined,
    });
  };

  const handleClearFilters = () => {
    setLocalSearchTerm('');
    setLocalStatusFilter('');
    handleFilterChange({});
  };

  const handleEditarCobranca = (cobranca: Cobranca) => {
    setCobrancaParaEditar(cobranca);
    setFormAberto(true);
  };

  const handleViewUnidadeDetails = (codigoUnidade: number) => {
    setSelectedUnidadeCodigo(codigoUnidade);
    setModalUnidadeOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'codigo_unidade', headerName: 'Unidade', width: 100, renderCell: params => <Chip label={params.value} size="small" onClick={() => handleViewUnidadeDetails(params.value)} sx={{cursor: 'pointer'}} /> },
    { field: 'tipo_cobranca', headerName: 'Tipo', width: 150, renderCell: params => <Chip label={tipoLabels[params.value as TipoCobranca]} size="small" variant="outlined" /> },
    { field: 'valor_atualizado', headerName: 'Valor', width: 150, valueFormatter: (value: number) => formatCurrency(value) },
    { field: 'vencimento', headerName: 'Vencimento', width: 120, valueFormatter: (value: string) => format(new Date(value), 'dd/MM/yyyy') },
    { field: 'status', headerName: 'Status', width: 120, renderCell: params => <Chip label={statusLabels[params.value as StatusCobranca]} size="small" color={statusColors[params.value as StatusCobranca]} /> },
    { field: 'observacoes', headerName: 'Observações', flex: 1 },
    {
      field: 'actions', type: 'actions', width: 100,
      getActions: (params) => [
        <GridActionsCellItem icon={<Edit size={16} />} label="Editar" onClick={() => handleEditarCobranca(params.row)} />,
        <GridActionsCellItem icon={<FileText size={16} />} label="Boleto" onClick={() => toast.info('Gerar boleto em breve')} />,
        <GridActionsCellItem icon={<MessageSquare size={16} />} label="Negociar" onClick={() => toast.info('Negociar em breve')} />,
      ],
    },
  ];

  const statCards = [
    { title: 'Valor em Aberto', value: formatCurrency(estatisticas?.valorTotalEmAberto || 0), icon: DollarSign, color: '#667eea' },
    { title: 'Cobranças Pagas', value: estatisticas?.pagas || 0, icon: CheckCircle, color: '#11998e' },
    { title: 'Pendentes', value: estatisticas?.emAberto || 0, icon: Clock, color: '#ffa726' },
    { title: 'Vencidas', value: estatisticas?.vencidas || 0, icon: AlertTriangle, color: '#f44336' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>Cobranças</Typography>
          <Typography variant="body1" color="text.secondary">Gestão de cobranças com performance otimizada.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Download size={20} />} disabled>Exportar</Button>
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => setFormAberto(true)}>Nova Cobrança</Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)", border: "1px solid", borderColor: "divider", borderLeft: "6px solid", borderLeftColor: "primary.main" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ backgroundColor: "primary.main", borderRadius: 3, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Filter size={24} color="white" /></Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Filtros de Pesquisa</Typography>
              <Typography variant="body2" color="text.secondary">Use os filtros para encontrar cobranças específicas</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField label="Buscar por unidade ou observação..." size="small" value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} sx={{ flex: '1 1 300px' }} InputProps={{ startAdornment: <Search size={20} style={{ marginRight: 8 }} /> }} />
            <TextField select label="Status" size="small" value={localStatusFilter} onChange={e => setLocalStatusFilter(e.target.value as StatusCobranca)} sx={{ minWidth: 150 }}>
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(statusLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
            </TextField>
            <Button variant="contained" startIcon={<Search size={16} />} onClick={handleSearch}>Buscar</Button>
            <Button variant="outlined" onClick={handleClearFilters}>Limpar</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ p: 2, borderRadius: 3, borderLeft: `6px solid ${card.color}`, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${card.color}26` } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{isLoadingStats ? <CircularProgress size={24} /> : card.value}</Typography>
                  <Typography variant="body1" color="text.secondary">{card.title}</Typography>
                </Box>
                <Box sx={{ backgroundColor: `${card.color}1A`, borderRadius: 3, p: 2, display: 'flex' }}><card.icon size={32} color={card.color} /></Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabela */}
      <Card>
        <DataGrid
          rows={cobrancas}
          columns={columns}
          loading={isLoading}
          rowCount={total}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => {
            handlePageChange(model.page);
            handlePageSizeChange(model.pageSize);
          }}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          autoHeight
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
        />
      </Card>

      <CobrancaForm open={formAberto} onClose={() => setFormAberto(false)} cobranca={cobrancaParaEditar} />
      <UnidadeDetalhesModal open={modalUnidadeOpen} onClose={() => setModalUnidadeOpen(false)} codigoUnidade={selectedUnidadeCodigo} />
    </Box>
  );
}