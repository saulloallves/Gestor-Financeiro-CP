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
  Grid,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, GridActionsCellItem, type GridColDef, type GridPaginationModel, type GridRowSelectionModel } from '@mui/x-data-grid';
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
  RefreshCw,
  Eye,
  Zap, // Novo ícone para ação em lote
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCobrancasCacheFirst } from '../hooks/useCobrancasCacheFirst';
import { useCobrancasEstatisticasCacheFirst } from '../hooks/useCobrancasEstatisticasCacheFirst';
import { useSyncAsaasPayments, useSyncAsaasStatuses } from '../hooks/useAsaasSync';
import { useGerarBoleto, useSincronizarStatus, useGerarBoletosEmLote } from '../hooks/useCobrancas';
import {
  type Cobranca,
  type StatusCobranca,
  type TipoCobranca,
} from '../types/cobrancas';
import { CobrancaForm } from '../components/CobrancaForm';
import { UnidadeDetalhesModal } from '../components/UnidadeDetalhesModal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { BatchProgressModal } from '../components/BatchProgressModal';

const statusLabels: Record<StatusCobranca, string> = {
  pendente: 'Pendente', em_aberto: 'Em Aberto', pago: 'Pago', em_atraso: 'Em Atraso',
  vencido: 'Vencido', negociado: 'Negociado', parcelado: 'Parcelado', cancelado: 'Cancelado',
  atrasado: 'Atrasado', juridico: 'Jurídico',
};

const statusStyles: Record<StatusCobranca, { color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'; variant: 'filled' | 'outlined' }> = {
  pago: { color: 'success', variant: 'filled' },
  vencido: { color: 'error', variant: 'outlined' },
  juridico: { color: 'error', variant: 'filled' },
  em_atraso: { color: 'warning', variant: 'outlined' },
  atrasado: { color: 'warning', variant: 'outlined' },
  pendente: { color: 'default', variant: 'outlined' },
  em_aberto: { color: 'primary', variant: 'outlined' },
  negociado: { color: 'info', variant: 'filled' },
  parcelado: { color: 'secondary', variant: 'outlined' },
  cancelado: { color: 'default', variant: 'filled' },
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
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [activeBoletoUrl, setActiveBoletoUrl] = useState<string | null>(null);
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>([]);
  const [batchModalOpen, setBatchModalOpen] = useState(false);

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState<StatusCobranca | ''>('');

  const {
    cobrancas,
    total,
    isLoading,
    filters,
    pagination,
    handleFilterChange,
    handlePaginationModelChange,
  } = useCobrancasCacheFirst();

  const { data: estatisticas, isLoading: isLoadingStats } = useCobrancasEstatisticasCacheFirst();
  const syncPaymentsMutation = useSyncAsaasPayments();
  const syncStatusesMutation = useSyncAsaasStatuses();
  const gerarBoletoMutation = useGerarBoleto();
  const sincronizarStatusMutation = useSincronizarStatus();
  const gerarBoletosEmLoteMutation = useGerarBoletosEmLote();

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

  const handleSyncPayments = () => {
    syncPaymentsMutation.mutate();
  };

  const handleSyncStatuses = () => {
    syncStatusesMutation.mutate();
  };

  const handleGerarBoleto = async (id: string) => {
    try {
      const data = await gerarBoletoMutation.mutateAsync(id);
      setActiveBoletoUrl(data.boleto_url);
      setConfirmationModalOpen(true);
    } catch (error) {
      console.error("Falha ao gerar boleto:", error);
    }
  };

  const handleSincronizarStatus = (id: string) => {
    sincronizarStatusMutation.mutate(id);
  };

  const handleNegociar = () => {
    toast.info('Funcionalidade de negociação em breve!');
  };

  const handleGerarBoletosEmLote = () => {
    if (selectionModel.length === 0) {
      toast.error('Selecione pelo menos uma cobrança.');
      return;
    }
    setBatchModalOpen(true);
    gerarBoletosEmLoteMutation.mutate(selectionModel as string[]);
  };

  const columns: GridColDef[] = [
    { field: 'codigo_unidade', headerName: 'Unidade', width: 100, renderCell: params => <Chip label={params.value} size="small" color="primary" onClick={() => handleViewUnidadeDetails(params.value)} sx={{cursor: 'pointer'}} /> },
    { field: 'tipo_cobranca', headerName: 'Tipo', width: 150, renderCell: params => <Chip label={tipoLabels[params.value as TipoCobranca]} size="small" variant="outlined" /> },
    { field: 'valor_atualizado', headerName: 'Valor', width: 150, valueFormatter: (value: number) => formatCurrency(value) },
    { field: 'vencimento', headerName: 'Vencimento', width: 120, valueFormatter: (value: string) => format(new Date(value), 'dd/MM/yyyy') },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120, 
      renderCell: params => {
        const status = params.value as StatusCobranca;
        const style = statusStyles[status] || { color: 'default', variant: 'filled' };
        return <Chip label={statusLabels[status]} size="small" color={style.color} variant={style.variant} />;
      } 
    },
    { field: 'observacoes', headerName: 'Observações', flex: 1 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      flex: 0.6,
      minWidth: 100,
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 3,
          mb: 3,
        }}
      >
        {statCards.map((card, index) => (
          <Card
            key={index}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: "background.paper",
              color: "text.primary",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: `6px solid ${card.color}`,
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: `0 8px 25px ${card.color}26`,
                borderLeftColor: card.color,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
                >
                  {isLoadingStats ? <CircularProgress size={24} /> : card.value}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
                  {card.title}
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: `${card.color}1A`,
                  borderRadius: 3,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <card.icon size={32} color={card.color} />
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Ações em Lote */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>
            {selectionModel.length} cobrança(s) selecionada(s)
          </Typography>
          <Button
            variant="contained"
            startIcon={<Zap size={16} />}
            disabled={selectionModel.length === 0 || gerarBoletosEmLoteMutation.isPending}
            onClick={handleGerarBoletosEmLote}
          >
            Gerar Boletos em Lote
          </Button>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <DataGrid
          rows={cobrancas}
          columns={columns}
          loading={isLoading}
          rowCount={total}
          paginationModel={pagination}
          onPaginationModelChange={handlePaginationModelChange}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          autoHeight
          checkboxSelection
          onRowSelectionModelChange={(newSelectionModel) => {
            setSelectionModel(newSelectionModel);
          }}
          rowSelectionModel={selectionModel}
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
        />
      </Card>

      <CobrancaForm open={formAberto} onClose={() => setFormAberto(false)} cobranca={cobrancaParaEditar} />
      <UnidadeDetalhesModal open={modalUnidadeOpen} onClose={() => setModalUnidadeOpen(false)} codigoUnidade={selectedUnidadeCodigo} />
      <ConfirmationDialog
        open={confirmationModalOpen}
        onClose={() => {
          if (activeBoletoUrl) {
            navigator.clipboard.writeText(activeBoletoUrl);
            toast.success('Link do boleto copiado para a área de transferência!');
          }
          setConfirmationModalOpen(false);
          setActiveBoletoUrl(null);
        }}
        onConfirm={() => {
          if (activeBoletoUrl) {
            window.open(activeBoletoUrl, '_blank');
          }
          setConfirmationModalOpen(false);
          setActiveBoletoUrl(null);
        }}
        title="Boleto Gerado com Sucesso"
        message="Deseja abrir o link em uma nova guia?"
        confirmText="Abrir Link"
        cancelText="Copiar Link"
      />
      <BatchProgressModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        isLoading={gerarBoletosEmLoteMutation.isPending}
        results={gerarBoletosEmLoteMutation.data || null}
        totalSelected={selectionModel.length}
      />
    </Box>
  );
}