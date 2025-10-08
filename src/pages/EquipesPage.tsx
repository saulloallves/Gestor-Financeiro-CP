import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Tooltip,
  Stack,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Plus,
  Search,
  Edit,
  Archive,
  ArchiveRestore,
  Users,
  Download,
  Filter,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { ptBR } from "@mui/x-data-grid/locales";
import { useEquipes, useInativarEquipe, useAtivarEquipe } from "../hooks/useEquipes";
import { EquipeForm } from "../components/EquipeForm";
import type { Equipe, FiltrosEquipes } from "../types/equipes";

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

export function EquipesPage() {
  const theme = useTheme();
  const [filtros, setFiltros] = React.useState<FiltrosEquipes>({});
  const [equipeSelecionada, setEquipeSelecionada] = React.useState<Equipe | undefined>();
  const [formOpen, setFormOpen] = React.useState(false);
  const [termoBusca, setTermoBusca] = React.useState("");
  const [isExporting] = React.useState(false); // Para futuro uso de exportação

  // Hooks
  const { data: equipes, isLoading, error } = useEquipes(filtros);
  const inativarMutation = useInativarEquipe();
  const ativarMutation = useAtivarEquipe();

  // Debounce para busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros(prev => ({
        ...prev,
        termo_busca: termoBusca || undefined,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [termoBusca]);

  // Handlers
  const handleNovaEquipe = () => {
    setEquipeSelecionada(undefined);
    setFormOpen(true);
  };

  const handleEditarEquipe = (equipe: Equipe) => {
    setEquipeSelecionada(equipe);
    setFormOpen(true);
  };

  const handleInativarEquipe = async (id: string) => {
    await inativarMutation.mutateAsync(id);
  };

  const handleAtivarEquipe = async (id: string) => {
    await ativarMutation.mutateAsync(id);
  };

  const handleExport = () => {
    // TODO: Implementar exportação
    console.log("Exportar equipes");
  };

  // Colunas da DataGrid
  const columns: GridColDef[] = [
    {
      field: "nome_equipe",
      headerName: "Nome da Equipe",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Users size={16} color={theme.palette.primary.main} />
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "descricao",
      headerName: "Descrição",
      flex: 2,
      minWidth: 250,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {params.value || "Sem descrição"}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === "ativa" ? "Ativa" : "Inativa"}
          color={params.value === "ativa" ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "created_at",
      headerName: "Criada em",
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(params.value).toLocaleDateString("pt-BR")}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const equipe = params.row as Equipe;
        
        return (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Editar equipe">
              <IconButton
                size="small"
                onClick={() => handleEditarEquipe(equipe)}
                sx={{ color: "primary.main" }}
              >
                <Edit size={16} />
              </IconButton>
            </Tooltip>
            
            {equipe.status === "ativa" ? (
              <Tooltip title="Inativar equipe">
                <IconButton
                  size="small"
                  onClick={() => handleInativarEquipe(equipe.id)}
                  sx={{ color: "warning.main" }}
                >
                  <Archive size={16} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Ativar equipe">
                <IconButton
                  size="small"
                  onClick={() => handleAtivarEquipe(equipe.id)}
                  sx={{ color: "success.main" }}
                >
                  <ArchiveRestore size={16} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ];

  if (error) {
    return (
      <Card sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error" variant="h6">
          Erro ao carregar equipes
        </Typography>
        <Button onClick={() => window.location.reload()} sx={{ mt: 2 }} variant="outlined">
          Tentar novamente
        </Button>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {/* Cabeçalho */}
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
            Gerenciamento de Equipes
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Organize sua equipe em grupos específicos para melhor controle de acesso
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
            {isExporting ? <CircularProgress size={20} /> : "Exportar"}
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={handleNovaEquipe}
            sx={{ minWidth: 160 }}
          >
            Nova Equipe
          </Button>
        </Box>
      </Box>

      {/* Filtros e Busca */}
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
          {/* Cabeçalho da seção de filtros */}
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
                Use os filtros para encontrar equipes específicas
              </Typography>
            </Box>
          </Box>

          {/* Campos de filtro */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <TextField
              placeholder="Buscar por nome da equipe..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, flexGrow: 1 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Tabela de Equipes */}
      <Card
        sx={{
          borderRadius: 3,
          backgroundColor: "background.paper",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ padding: "0 !important" }}>
          <DataGrid
            rows={equipes || []}
            columns={columns}
            loading={isLoading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme.palette.grey[50],
                borderBottom: `2px solid ${theme.palette.divider}`,
                fontWeight: 600,
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <EquipeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        equipe={equipeSelecionada}
      />
    </Box>
  );
}