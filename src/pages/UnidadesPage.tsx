// Página de Listagem de Unidades - Módulo 2.1
// Seguindo as diretrizes de design e arquitetura do projeto

import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
} from "@mui/x-data-grid";
import { ptBR } from "@mui/x-data-grid/locales";
import { useTheme } from "@mui/material/styles";
import {
  Search,
  Filter,
  Download,
  Building2,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  Database,
} from "lucide-react";
import { useUnidades, useUnidadesEstatisticas } from "../hooks/useUnidades";
import { getStatusLabel, getStatusColor } from "../utils/statusMask";
import type { StatusUnidade, UnidadeFilter } from "../types/unidades";

export function UnidadesPage() {
  const theme = useTheme();
  
  const [filters, setFilters] = useState<UnidadeFilter>({});
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 50,
  });

  // Estado local para os inputs de filtro
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localStatusFilter, setLocalStatusFilter] = useState<StatusUnidade | "">("");

  const {
    data: unidadesData,
    isLoading,
    isError,
    refetch,
  } = useUnidades(
    filters,
    { field: "codigo_unidade", direction: "asc" },
    { page: paginationModel.page + 1, limit: paginationModel.pageSize }
  );

  const unidades = unidadesData?.data || [];
  const total = unidadesData?.pagination.total || 0;

  const { data: estatisticas, isLoading: isLoadingStats } =
    useUnidadesEstatisticas();

  const handleSearch = () => {
    setFilters({
      nome_padrao: localSearchTerm || undefined,
      status: localStatusFilter ? [localStatusFilter] : undefined,
    });
  };

  const handleClearFilters = () => {
    setLocalSearchTerm("");
    setLocalStatusFilter("");
    setFilters({});
  };

  const columns: GridColDef[] = [
    {
      field: "codigo_unidade",
      headerName: "Código",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            fontWeight: "bold",
          }}
        />
      ),
    },
    {
      field: "nome_padrao",
      headerName: "Nome da Unidade",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            justifyContent: "left",
          }}
        >
          <Building2 size={16} color={theme.palette.primary.main} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "cnpj",
      headerName: "CNPJ",
      flex: 0.5,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", width: "100%" }}
        >
          {params.value || "-"}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.5,
      renderCell: (params) => {
        const status = params.value as StatusUnidade;
        return (
          <Chip
            label={getStatusLabel(status)}
            color={getStatusColor(status)}
            size="small"
            variant="outlined"
          />
        );
      },
    },
    {
      field: "telefone_comercial",
      headerName: "Telefone",
      flex: 0.5,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {params.value && (
            <Phone size={14} color={theme.palette.text.secondary} />
          )}
          <Typography variant="body2" color="text.secondary">
            {params.value || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "endereco_cidade",
      headerName: "Cidade",
      flex: 0.8,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {params.value && (
            <MapPin size={14} color={theme.palette.text.secondary} />
          )}
          <Typography variant="body2" color="text.secondary">
            {params.value || "-"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "endereco_uf",
      headerName: "UF",
      flex: 0.3,
      renderCell: (params) => (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500, textAlign: "center", width: "100%" }}
        >
          {params.value || "-"}
        </Typography>
      ),
    },
  ];

  if (isError) {
    return (
      <Card sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error" variant="h6">
          Erro ao carregar unidades
        </Typography>
        <Button onClick={() => refetch()} sx={{ mt: 2 }} variant="outlined">
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, color: "text.primary" }}
            >
              Unidades da Rede
            </Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5, 
                px: 1, 
                py: 0.5, 
                backgroundColor: 'success.main',
                borderRadius: 1,
                color: 'white'
              }}
            >
              <Database size={16} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                LIVE
              </Typography>
            </Box>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Gerencie todas as unidades franqueadas da rede
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
            disabled
            sx={{ minWidth: 140 }}
          >
            Exportar (Em breve)
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
                Use os filtros para encontrar unidades específicas
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
              placeholder="Buscar por nome da unidade..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
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
              value={localStatusFilter}
              onChange={(e) =>
                setLocalStatusFilter(e.target.value as StatusUnidade | "")
              }
              size="small"
              sx={{
                minWidth: 150,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            >
              <MenuItem value="">Todos os status</MenuItem>
              <MenuItem value="OPERAÇÃO">Operação</MenuItem>
              <MenuItem value="IMPLANTAÇÃO">Implantação</MenuItem>
              <MenuItem value="SUSPENSO">Suspenso</MenuItem>
              <MenuItem value="CANCELADO">Cancelado</MenuItem>
            </TextField>

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
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 3,
          marginBottom: theme.spacing(3),
        }}
      >
        {/* Total de Unidades */}
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
                variant="h5"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {isLoadingStats ? (
                  <CircularProgress size={24} />
                ) : (
                  estatisticas?.total || 0
                )}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Total de Unidades
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
              <Building size={32} color="#667eea" />
            </Box>
          </Box>
        </Card>

        {/* Unidades Ativas */}
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
                variant="h5"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {isLoadingStats ? (
                  <CircularProgress size={24} />
                ) : (
                  estatisticas?.operacao || 0
                )}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Ativas
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

        {/* Em Implantação */}
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
                variant="h5"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {isLoadingStats ? (
                  <CircularProgress size={24} />
                ) : (
                  estatisticas?.implantacao || 0
                )}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Em Implantação
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

        {/* Canceladas */}
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
                variant="h5"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {isLoadingStats ? (
                  <CircularProgress size={24} />
                ) : (
                  estatisticas?.cancelado || 0
                )}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Canceladas
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
              <XCircle size={32} color="#f44336" />
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Tabela de Unidades */}
      <Card
        sx={{
          width: "100%",
          overflow: "hidden",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            width: "100%",
            flexGrow: 1,
            "& .MuiDataGrid-root": {
              width: "100%",
              maxWidth: "100%",
            },
          }}
        >
          <DataGrid
            rows={unidades}
            columns={columns}
            loading={isLoading}
            rowCount={total}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            pageSizeOptions={[10, 20, 50, 100]}
            localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
            sx={{
              border: "none",
              backgroundColor: "#FFFFFF",
              width: "100%",
              minWidth: 0,
              "& .MuiDataGrid-main": {
                backgroundColor: "#FFFFFF",
                minWidth: 0,
              },
              "& .MuiDataGrid-cell": {
                borderColor: "divider",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
                padding: theme.spacing(2, 1.5), // Aumenta o padding das células
                fontSize: "1rem", // Aumenta ainda mais o tamanho da fonte das células
                display: "flex",
                alignItems: "center", // Centraliza verticalmente
                justifyContent: "center", // Centraliza horizontalmente
                "& .MuiTypography-root": {
                  fontSize: "1rem !important", // Força o tamanho da fonte para todos os Typography
                },
                "& .MuiChip-root": {
                  fontSize: "0.9rem", // Tamanho específico para chips
                },
              },
              "& .MuiDataGrid-columnHeaders": {
                borderColor: "divider",
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#FFFFFF",
                  padding: theme.spacing(1.5, 1.5), // Padding para headers
                  fontSize: "1rem", // Aumenta ainda mais o tamanho da fonte dos headers
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center", // Centraliza headers
                  textAlign: "center",
                },
              },
              "& .MuiDataGrid-virtualScroller": {
                overflow: "auto",
              },
              "& .MuiDataGrid-row": {
                minHeight: "65px !important", // Altura mínima das linhas
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              },
              "& .MuiDataGrid-columnHeader": {
                minWidth: 0,
              },
            }}
            disableRowSelectionOnClick
            autoHeight
            hideFooterSelectedRowCount
            rowHeight={64} // Define altura fixa das linhas
          />
        </Box>
      </Card>
    </Box>
  );
}