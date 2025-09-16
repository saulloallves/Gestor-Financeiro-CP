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
  Clock,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useCobrancas,
  useEstatisticasCobrancas,
  useAtualizarValoresCobrancas,
  useGerarBoletoAsaas,
  useSincronizarStatusAsaas,
} from '../hooks/useCobrancas';
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
      codigo_unidade: unidadeFilter ? parseInt(unidadeFilter) : undefined,
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
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
          #{params.value?.slice(-8) || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'observacoes',
      headerName: 'Descrição',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {params.value || '-'}
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
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.primary' }}>
          {formatDate(params.value)}
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

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        padding: theme.spacing(3),
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2, md: 0 },
          marginBottom: theme.spacing(3),
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Gestão de Cobranças
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Gerencie todas as cobranças da sua rede de franquias
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Download size={20} />}
            onClick={handleExport}
            disabled={isExporting}
            sx={{ minWidth: 140 }}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => setFormAberto(true)}
            sx={{ minWidth: 160 }}
          >
            Nova Cobrança
          </Button>
        </Box>
      </Box>

      <Card
        sx={{
          marginBottom: theme.spacing(3),
          width: "100%",
          borderRadius: 3,
          backgroundColor: "background.paper",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid",
          borderColor: "divider",
          borderLeft: "6px solid",
          borderLeftColor: "primary.main",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{
                backgroundColor: "primary.main",
                borderRadius: 3,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Filter size={24} color="white" />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 0.5,
                }}
              >
                Filtros de Pesquisa
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Use os filtros para encontrar cobranças específicas
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <TextField
              placeholder="Buscar por código, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box
                    sx={{
                      marginRight: 1,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Search size={20} color={theme.palette.text.secondary} />
                  </Box>
                ),
              }}
              size="small"
              sx={{
                flex: "1 1 300px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusCobranca | '')}
              size="small"
              sx={{
                minWidth: 150,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
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
              onChange={(e) => setTipoFilter(e.target.value as TipoCobranca | '')}
              size="small"
              sx={{
                minWidth: 150,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
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
              value={unidadeFilter}
              onChange={(e) => setUnidadeFilter(e.target.value)}
              placeholder="Ex: 1116, 2546"
              size="small"
              type="number"
              inputProps={{ 
                min: 1000,
                max: 9999
              }}
              sx={{
                minWidth: 200,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<Search size={16} />}
                onClick={handleSearch}
                size="medium"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 500,
                  textTransform: "none",
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
                  textTransform: "none",
                }}
              >
                Limpar
              </Button>
              <Button
                variant="outlined"
                onClick={handleAtualizarValores}
                startIcon={<RefreshCw size={16} />}
                disabled={atualizarValores.isPending}
                size="medium"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 500,
                  textTransform: "none",
                }}
              >
                Atualizar Valores
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 3,
          marginBottom: theme.spacing(3),
        }}
      >
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid",
            borderColor: "divider",
            borderLeft: "6px solid #667eea",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 25px rgba(102, 126, 234, 0.15)",
              borderLeftColor: "#5a67d8",
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
                variant="h3"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {estatisticas?.totalCobrancas || 0}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Total de Cobranças
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                borderRadius: 3,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={32} color="#667eea" />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid",
            borderColor: "divider",
            borderLeft: "6px solid #11998e",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 25px rgba(17, 153, 142, 0.15)",
              borderLeftColor: "#0d7377",
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
                variant="h3"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {formatCurrency(estatisticas?.cobrancasPagas || 0)}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Valor Pago
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: "rgba(17, 153, 142, 0.1)",
                borderRadius: 3,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle size={32} color="#11998e" />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid",
            borderColor: "divider",
            borderLeft: "6px solid #ffa726",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 25px rgba(255, 167, 38, 0.15)",
              borderLeftColor: "#ff9800",
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
                variant="h3"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {formatCurrency(estatisticas?.valorTotalEmAberto || 0)}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Valor Pendente
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: "rgba(255, 167, 38, 0.1)",
                borderRadius: 3,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={32} color="#ffa726" />
            </Box>
          </Box>
        </Card>

        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid",
            borderColor: "divider",
            borderLeft: "6px solid #f44336",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 25px rgba(244, 67, 54, 0.15)",
              borderLeftColor: "#d32f2f",
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
                variant="h3"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {formatCurrency(estatisticas?.valorTotalVencido || 0)}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Valor Vencido
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: "rgba(244, 67, 54, 0.1)",
                borderRadius: 3,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={32} color="#f44336" />
            </Box>
          </Box>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Typography variant="h6" sx={{ color: 'text.primary' }}>
          Lista de Cobranças ({cobrancas.length})
        </Typography>
      </Box>

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

      <CobrancaForm
        open={formAberto}
        onClose={handleFecharForm}
        cobranca={cobrancaParaEditar}
      />
    </Box>
  );
}