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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  Plus,
  Search,
  Edit,
  Archive,
  ArchiveRestore,
  Mail,
  Phone,
  Download,
  Filter,
  X,
} from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { ptBR } from "@mui/x-data-grid/locales";
import { 
  useUsuariosInternos, 
  useInativarUsuario, 
  useAtivarUsuario 
} from "../hooks/useUsuariosInternos";
import { useEquipesAtivas } from "../hooks/useEquipes";
import { UsuarioInternoForm } from "../components/UsuarioInternoForm";
import type { 
  UsuarioInterno, 
  UsuarioInternoListItem, 
  FiltrosUsuarios, 
  PerfilUsuario,
  StatusUsuario 
} from "../types/equipes";

// ==============================================
// HELPERS
// ==============================================

const getPerfilColor = (perfil: PerfilUsuario) => {
  switch (perfil) {
    case "admin":
      return "error";
    case "gestor":
      return "warning";
    case "juridico":
      return "info";
    case "operador":
    default:
      return "primary";
  }
};

const getPerfilLabel = (perfil: PerfilUsuario) => {
  switch (perfil) {
    case "admin":
      return "Administrador";
    case "gestor":
      return "Gestor";
    case "juridico":
      return "Jurídico";
    case "operador":
    default:
      return "Operador";
  }
};

const getInitials = (nome: string) => {
  return nome
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

export function UsuariosInternosPage() {
  const theme = useTheme();
  const [filtros, setFiltros] = React.useState<FiltrosUsuarios>({});
  const [usuarioSelecionado, setUsuarioSelecionado] = React.useState<UsuarioInterno | undefined>();
  const [formOpen, setFormOpen] = React.useState(false);
  const [termoBusca, setTermoBusca] = React.useState("");
  const [equipeFilter, setEquipeFilter] = React.useState<string>("");
  const [perfilFilter, setPerfilFilter] = React.useState<PerfilUsuario | "">("");
  const [statusFilter, setStatusFilter] = React.useState<StatusUsuario | "">("");
  const [isExporting] = React.useState(false); // Para futuro uso de exportação

  // Hooks
  const { data: usuarios, isLoading, error } = useUsuariosInternos(filtros);
  const { data: equipesAtivas } = useEquipesAtivas();
  const inativarMutation = useInativarUsuario();
  const ativarMutation = useAtivarUsuario();

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
  const handleNovoUsuario = () => {
    setUsuarioSelecionado(undefined);
    setFormOpen(true);
  };

  const handleEditarUsuario = (usuario: UsuarioInternoListItem) => {
    setUsuarioSelecionado(usuario);
    setFormOpen(true);
  };

  const handleInativarUsuario = async (id: string) => {
    await inativarMutation.mutateAsync(id);
  };

  const handleAtivarUsuario = async (id: string) => {
    await ativarMutation.mutateAsync(id);
  };

  const handleExport = () => {
    // TODO: Implementar exportação
    console.log("Exportar usuários internos");
  };

  const handleClearFilters = () => {
    setTermoBusca("");
    setEquipeFilter("");
    setPerfilFilter("");
    setStatusFilter("");
    setFiltros({});
  };

  const handleFiltroEquipe = (equipeId: string) => {
    setEquipeFilter(equipeId);
    setFiltros(prev => ({
      ...prev,
      equipe_id: equipeId || undefined,
    }));
  };

  const handleFiltroPerfil = (perfil: PerfilUsuario | "") => {
    setPerfilFilter(perfil);
    setFiltros(prev => ({
      ...prev,
      perfil: (perfil as PerfilUsuario) || undefined,
    }));
  };

  const handleFiltroStatus = (status: StatusUsuario | "") => {
    setStatusFilter(status);
    setFiltros(prev => ({
      ...prev,
      status: (status as StatusUsuario) || undefined,
    }));
  };

  // Colunas da DataGrid
  const columns: GridColDef[] = [
    {
      field: "nome",
      headerName: "Usuário",
      flex: 1,
      minWidth: 250,
      renderCell: (params) => {
        const usuario = params.row as UsuarioInternoListItem;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "primary.main",
                fontSize: "0.875rem",
              }}
            >
              {getInitials(usuario.nome)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {usuario.nome}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {usuario.email}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "equipe_nome",
      headerName: "Equipe",
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || "Sem equipe"}
        </Typography>
      ),
    },
    {
      field: "perfil",
      headerName: "Perfil",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={getPerfilLabel(params.value)}
          color={getPerfilColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "telefone",
      headerName: "Contato",
      width: 140,
      renderCell: (params) => {
        const usuario = params.row as UsuarioInternoListItem;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {usuario.telefone ? (
              <Tooltip title={usuario.telefone}>
                <Phone size={14} color={theme.palette.text.secondary} />
              </Tooltip>
            ) : (
              <Tooltip title={usuario.email}>
                <Mail size={14} color={theme.palette.text.secondary} />
              </Tooltip>
            )}
            <Typography variant="body2" color="text.secondary">
              {usuario.telefone || "E-mail"}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value === "ativo" ? "Ativo" : "Inativo"}
          color={params.value === "ativo" ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "ultimo_login",
      headerName: "Último Login",
      width: 140,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value 
            ? new Date(params.value).toLocaleDateString("pt-BR")
            : "Nunca"}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const usuario = params.row as UsuarioInternoListItem;
        
        return (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Editar usuário">
              <IconButton
                size="small"
                onClick={() => handleEditarUsuario(usuario)}
                sx={{ color: "primary.main" }}
              >
                <Edit size={16} />
              </IconButton>
            </Tooltip>
            
            {usuario.status === "ativo" ? (
              <Tooltip title="Inativar usuário">
                <IconButton
                  size="small"
                  onClick={() => handleInativarUsuario(usuario.id)}
                  sx={{ color: "warning.main" }}
                >
                  <Archive size={16} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Ativar usuário">
                <IconButton
                  size="small"
                  onClick={() => handleAtivarUsuario(usuario.id)}
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
          Erro ao carregar usuários internos
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
        padding: theme.spacing(3),
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
            Gerenciamento de Usuários Internos
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Controle de acesso e permissões da equipe interna da organização
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
            onClick={handleNovoUsuario}
            sx={{ minWidth: 160 }}
          >
            Novo Usuário
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
                Use os filtros para encontrar usuários específicos
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
              placeholder="Buscar por nome ou email..."
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

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Equipe</InputLabel>
              <Select
                value={equipeFilter}
                onChange={(e) => handleFiltroEquipe(e.target.value)}
                label="Equipe"
              >
                <MenuItem value="">Todas as equipes</MenuItem>
                {equipesAtivas?.map((equipe) => (
                  <MenuItem key={equipe.id} value={equipe.id}>
                    {equipe.nome_equipe}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Perfil</InputLabel>
              <Select
                value={perfilFilter}
                onChange={(e) => handleFiltroPerfil(e.target.value as PerfilUsuario | "")}
                label="Perfil"
              >
                <MenuItem value="">Todos os perfis</MenuItem>
                <MenuItem value="operador">Operador</MenuItem>
                <MenuItem value="gestor">Gestor</MenuItem>
                <MenuItem value="juridico">Jurídico</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => handleFiltroStatus(e.target.value as StatusUsuario | "")}
                label="Status"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ativo">Ativo</MenuItem>
                <MenuItem value="inativo">Inativo</MenuItem>
              </Select>
            </FormControl>

            {(termoBusca || equipeFilter || perfilFilter || statusFilter) && (
              <Button
                variant="outlined"
                startIcon={<X size={16} />}
                onClick={handleClearFilters}
                sx={{ minWidth: 100 }}
              >
                Limpar
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
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
            rows={usuarios || []}
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
      <UsuarioInternoForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        usuario={usuarioSelecionado}
      />
    </Box>
  );
}
