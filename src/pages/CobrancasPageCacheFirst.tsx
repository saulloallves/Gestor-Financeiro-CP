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
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
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
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  RefreshCw,
  Filter,
  Database,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCobrancasCacheFirst } from '../hooks/useCobrancasCacheFirst';
import { useDataStore } from '../store/dataStore';
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

export function CobrancasPageCacheFirst() {
  const theme = useTheme();
  const [cobrancaParaEditar, setCobrancaParaEditar] = useState<Cobranca | undefined>();
  const [formAberto, setFormAberto] = useState(false);
  const [modalUnidadeOpen, setModalUnidadeOpen] = useState(false);
  const [selectedUnidadeCodigo, setSelectedUnidadeCodigo] = useState<number | null>(null);

  const {
    cobrancas,
    total,
    isLoading,
    filters,
    pagination,
    handleFilterChange,
    handlePageChange,
    handlePageSizeChange,
    refetch,
  } = useCobrancasCacheFirst();

  const { getEstatisticasCobrancas } = useDataStore();
  const estatisticas = getEstatisticasCobrancas();

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

  const handleSearch = (newFilters: Partial<typeof filters>) => {
    handleFilterChange({ ...filters, ...newFilters });
  };

  const handleClearFilters = () => {
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
    { field: 'valor_atualizado', headerName: 'Valor', width: 150, valueFormatter: (value: number) => `R$ ${value.toFixed(2)}` },
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>Cobranças (Cache-First)</Typography>
          <Typography variant="body1" color="text.secondary">Gestão de cobranças com performance otimizada.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Download size={20} />} disabled>Exportar</Button>
          <Button variant="contained" startIcon={<Plus size={20} />} onClick={() => setFormAberto(true)}>Nova Cobrança</Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField label="Buscar..." size="small" onChange={e => handleSearch({ search: e.target.value })} InputProps={{ startAdornment: <Search size={18} /> }} />
          <TextField select label="Status" size="small" value={filters.status || ''} onChange={e => handleSearch({ status: e.target.value as StatusCobranca })} sx={{ minWidth: 150 }}>
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(statusLabels).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
          </TextField>
          <Button onClick={handleClearFilters}>Limpar</Button>
        </Box>
      </Card>

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