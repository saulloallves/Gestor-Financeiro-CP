import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import { ptBR } from "@mui/x-data-grid/locales";
import { format } from "date-fns";
import {
  Search,
  Edit,
  FileText,
  MessageSquare,
  Plus,
  Filter,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useCobrancasCacheFirst } from "../hooks/useCobrancasCacheFirst";
import { useCobrancasEstatisticas } from "../hooks/useCobrancasEstatisticas";
import {
  useSyncAsaasPayments,
  useSyncAsaasStatuses,
} from "../hooks/useAsaasSync";
import { useGerarBoleto, useSincronizarStatus } from "../hooks/useCobrancas";
import {
  type Cobranca,
  type StatusCobranca,
} from "../types/cobrancas";
import { CobrancaForm } from "../components/CobrancaForm";
import { UnidadeDetalhesModal } from "../components/UnidadeDetalhesModal";
import { ConfirmationDialog } from "../components/ui/ConfirmationDialog";

const statusLabels: Record<StatusCobranca, string> = {
  pendente: "Pendente",
  em_aberto: "Em Aberto",
  pago: "Pago",
  em_atraso: "Em Atraso",
  vencido: "Vencido",
  negociado: "Negociado",
  parcelado: "Parcelado",
  cancelado: "Cancelado",
  atrasado: "Atrasado",
  juridico: "Jurídico",
};

const statusStyles: Record<
  StatusCobranca,
  {
    color:
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "warning"
      | "info"
      | "success";
    variant: "filled" | "outlined";
  }
> = {
  pago: { color: "success", variant: "filled" },
  vencido: { color: "error", variant: "outlined" },
  juridico: { color: "error", variant: "filled" },
  em_atraso: { color: "warning", variant: "outlined" },
  atrasado: { color: "warning", variant: "outlined" },
  pendente: { color: "default", variant: "outlined" },
  em_aberto: { color: "primary", variant: "outlined" },
  negociado: { color: "info", variant: "filled" },
  parcelado: { color: "secondary", variant: "outlined" },
  cancelado: { color: "default", variant: "filled" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value
  );

export function CobrancasPage() {
  const [cobrancaParaEditar, setCobrancaParaEditar] = useState<
    Cobranca | undefined
  >();
  const [formAberto, setFormAberto] = useState(false);
  const [modalUnidadeOpen, setModalUnidadeOpen] = useState(false);
  const [selectedUnidadeCodigo, setSelectedUnidadeCodigo] = useState<
    number | null
  >(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [activeBoletoUrl, setActiveBoletoUrl] = useState<string | null>(null);

  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<
    StatusCobranca | ""
  >("");

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

  const { data: estatisticas, isLoading: isLoadingStats } =
    useCobrancasEstatisticas();
  const syncPaymentsMutation = useSyncAsaasPayments();
  const syncStatusesMutation = useSyncAsaasStatuses();
  const gerarBoletoMutation = useGerarBoleto();
  const sincronizarStatusMutation = useSincronizarStatus();

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
    setLocalSearchTerm("");
    setLocalStatusFilter("");
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
    syncPaymentsMutation.mutate({});
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
    toast("Funcionalidade de negociação em breve!", { icon: "ℹ️" });
  };

  const columns: GridColDef[] = [
    {
      field: "codigo_unidade",
      headerName: "Unidade",
      headerAlign: "center",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          onClick={() => handleViewUnidadeDetails(params.value)}
          sx={{
            cursor: "pointer",
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            fontWeight: "bold",
          }}
        />
      ),
    },
    {
      field: "observacoes",
      headerName: "Observações",
      flex: 1,
      minWidth: 250,
      align: "left",
      headerAlign: "left",
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: 1.4,
            textAlign: "left",
            width: "100%",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "valor_atualizado",
      headerName: "Valor",
      headerAlign: "center",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => {
        const cobranca = params.row as Cobranca;
        const isOverdue = ['vencido', 'em_atraso', 'atrasado', 'juridico'].includes(cobranca.status);

        if (isOverdue) {
          return (
            <Tooltip title="Ver detalhes do juros e multa" arrow>
              <Box
                onClick={() => toast("Funcionalidade em desenvolvimento!", { icon: "ℹ️" })}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: 'error.main',
                    lineHeight: 1.1,
                  }}
                >
                  {formatCurrency(cobranca.valor_atualizado)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    textDecoration: 'line-through',
                    lineHeight: 1,
                  }}
                >
                  {formatCurrency(cobranca.valor_original)}
                </Typography>
              </Box>
            </Tooltip>
          );
        }

        return (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {formatCurrency(cobranca.valor_atualizado)}
          </Typography>
        );
      },
    },
    {
      field: "vencimento",
      headerName: "Vencimento",
      width: 150,
      headerAlign: "center",
      renderCell: (params) => {
        const vencimento = new Date(params.value.replace(/-/g, '/'));
        const today = new Date();
        
        // Zerar horas para comparar apenas as datas
        vencimento.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - vencimento.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          // Atrasado
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.25,
                width: '100%',
                height: '100%',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {format(new Date(params.value.replace(/-/g, '/')), "dd/MM/yyyy")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'error.main',
                  fontWeight: 600,
                  lineHeight: 1,
                  fontSize: '0.75rem',
                }}
              >
                {diffDays} {diffDays === 1 ? 'dia atrasado' : 'dias atrasados'}
              </Typography>
            </Box>
          );
        } else if (diffDays === 0) {
          // Vence hoje
          return (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.25,
                width: '100%',
                height: '100%',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {format(new Date(params.value.replace(/-/g, '/')), "dd/MM/yyyy")}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'warning.main',
                  fontWeight: 600,
                  lineHeight: 1,
                  fontSize: '0.75rem',
                }}
              >
                Vencendo Hoje
              </Typography>
            </Box>
          );
        }

        // Vencimento futuro
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Calendar size={16} />
            <Typography variant="body2">
              {format(new Date(params.value.replace(/-/g, '/')), "dd/MM/yyyy")}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      headerAlign: "center",
      width: 110,
      renderCell: (params) => {
        const status = params.value as StatusCobranca;
        const style = statusStyles[status] || {
          color: "default",
          variant: "filled",
        };
        return (
          <Chip
            label={statusLabels[status]}
            size="small"
            color={style.color}
            variant={style.variant}
          />
        );
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Ações",
      headerAlign: "center",
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
    {
      title: "Valor em Aberto",
      value: formatCurrency(estatisticas?.valorTotalEmAberto || 0),
      icon: DollarSign,
      color: "#667eea",
    },
    {
      title: "Cobranças Pagas",
      value: estatisticas?.cobrancasPagas || 0,
      icon: CheckCircle,
      color: "#11998e",
    },
    {
      title: "Pendentes",
      value: (estatisticas?.totalCobrancas || 0) - (estatisticas?.cobrancasPagas || 0) - (estatisticas?.cobrancasVencidas || 0),
      icon: Clock,
      color: "#ffa726",
    },
    {
      title: "Vencidas",
      value: estatisticas?.cobrancasVencidas || 0,
      icon: AlertTriangle,
      color: "#f44336",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Cobranças
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestão de cobranças com performance otimizada.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Tooltip title="Sincronizar novos pagamentos do ASAAS">
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={handleSyncPayments}
              disabled={syncPaymentsMutation.isPending}
            >
              {syncPaymentsMutation.isPending
                ? "Sincronizando..."
                : "Sincronizar Pagamentos"}
            </Button>
          </Tooltip>
          <Tooltip title="Atualizar status de pagamentos existentes">
            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={handleSyncStatuses}
              disabled={syncStatusesMutation.isPending}
            >
              {syncStatusesMutation.isPending
                ? "Atualizando..."
                : "Atualizar Status"}
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => setFormAberto(true)}
          >
            Nova Cobrança
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid",
          borderColor: "divider",
          borderLeft: "6px solid",
          borderLeftColor: "primary.main",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
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
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filtros de Pesquisa
              </Typography>
              <Typography variant="body2" color="text.secondary">
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
              label="Buscar por unidade ou observação..."
              size="small"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              sx={{ flex: "1 1 300px" }}
              InputProps={{
                startAdornment: <Search size={20} style={{ marginRight: 8 }} />,
              }}
            />
            <TextField
              select
              label="Status"
              size="small"
              value={localStatusFilter}
              onChange={(e) =>
                setLocalStatusFilter(e.target.value as StatusCobranca)
              }
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Search size={16} />}
              onClick={handleSearch}
            >
              Buscar
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              Limpar
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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

      {/* Tabela */}
      <Card
        sx={{
          width: "100%",
          overflow: "hidden",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
          pageSizeOptions={[10, 25, 50, 100]}
          autoHeight
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            border: "none",
            backgroundColor: "#ffffff",
            "& .MuiDataGrid-cell": {
              borderColor: "divider",
              padding: (theme) => theme.spacing(2, 1.5),
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "& .MuiTypography-root": {
                fontSize: "1rem !important",
              },
              "& .MuiChip-root": {
                fontSize: "0.9rem",
              },
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#ffffff",
              borderColor: "divider",
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#ffffff",
                padding: (theme) => theme.spacing(1.5, 1.5),
                fontSize: "1rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              },
            },
            "& .MuiDataGrid-row": {
              minHeight: "65px !important",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            },
          }}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          rowHeight={64}
        />
      </Card>

      <CobrancaForm
        open={formAberto}
        onClose={() => setFormAberto(false)}
        cobranca={cobrancaParaEditar}
      />
      <UnidadeDetalhesModal
        open={modalUnidadeOpen}
        onClose={() => setModalUnidadeOpen(false)}
        codigoUnidade={selectedUnidadeCodigo}
      />
      <ConfirmationDialog
        open={confirmationModalOpen}
        onClose={() => {
          if (activeBoletoUrl) {
            navigator.clipboard.writeText(activeBoletoUrl);
            toast.success(
              "Link do boleto copiado para a área de transferência!"
            );
          }
          setConfirmationModalOpen(false);
          setActiveBoletoUrl(null);
        }}
        onConfirm={() => {
          if (activeBoletoUrl) {
            window.open(activeBoletoUrl, "_blank");
          }
          setConfirmationModalOpen(false);
          setActiveBoletoUrl(null);
        }}
        title="Boleto Gerado com Sucesso"
        message="Deseja abrir o link em uma nova guia?"
        confirmText="Abrir Link"
        cancelText="Copiar Link"
      />
    </Box>
  );
}