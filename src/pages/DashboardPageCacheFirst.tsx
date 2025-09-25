import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  AlertTriangle,
  Database,
  Cpu,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDashboardCacheFirst } from "../hooks/useDashboardCacheFirst";
import { useProcessarCobrancas } from "../hooks/useCobrancas";

export function DashboardPageCacheFirst() {
  const theme = useTheme();
  const { usuario } = useAuthStore();
  const { cardData, alerts, isLoading, isLoadingCache, isLoadingCobrancas } = useDashboardCacheFirst();
  const processarCobrancasMutation = useProcessarCobrancas();

  const handleProcessarCobrancas = () => {
    processarCobrancasMutation.mutate();
  };

  // Mapear ícones string para componentes
  const iconMap = {
    DollarSign,
    TrendingUp,
    Users,
    Clock,
  } as const;

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      {/* Header do Dashboard */}
      <Box sx={{ marginBottom: theme.spacing(4) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            Bem-vindo, {usuario?.nome || "Usuário"}!
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
              CACHE
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Aqui está um resumo da sua gestão financeira
        </Typography>
      </Box>

      {/* Cards de Resumo usando CSS Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: theme.spacing(3),
          marginBottom: theme.spacing(4),
        }}
      >
        {cardData.map((card, index) => {
          const IconComponent = iconMap[card.icon as keyof typeof iconMap];
          return (
            <Card
              key={index}
              sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: theme.spacing(2),
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor:
                        card.color === "primary.main"
                          ? "primary.light"
                          : card.color === "success.main"
                          ? "success.light"
                          : card.color === "secondary.main"
                          ? "secondary.light"
                          : "warning.light",
                      borderRadius: "50%",
                      width: 48,
                      height: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconComponent
                      size={24}
                      color={
                        card.color === "primary.main"
                          ? theme.palette.primary.main
                          : card.color === "success.main"
                          ? theme.palette.success.main
                          : card.color === "secondary.main"
                          ? theme.palette.secondary.main
                          : theme.palette.warning.main
                      }
                    />
                  </Box>
                  {isLoading ? (
                    <Skeleton variant="rectangular" width={60} height={24} />
                  ) : (
                    <Chip
                      label={card.change}
                      size="small"
                      color={card.change.startsWith("+") ? "success" : "error"}
                      variant="outlined"
                    />
                  )}
                </Box>
                {isLoading ? (
                  <>
                    <Skeleton variant="text" width="60%" height={32} />
                    <Skeleton variant="text" width="80%" height={20} />
                  </>
                ) : (
                  <>
                    <Typography
                      variant="h5"
                      component="div"
                      sx={{
                        fontWeight: 600,
                        marginBottom: theme.spacing(0.5),
                      }}
                    >
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Status de Carregamento */}
      {(isLoadingCache || isLoadingCobrancas) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Carregando dados...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isLoadingCache && "Cache: Carregando unidades e franqueados"}
                  {isLoadingCache && isLoadingCobrancas && " • "}
                  {isLoadingCobrancas && "API: Carregando cobranças"}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Seção de Alertas */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            component="h2"
            sx={{
              fontWeight: 600,
              marginBottom: theme.spacing(3),
            }}
          >
            Sistema Central Financeira Autônoma
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {alerts.map((alert, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  padding: theme.spacing(2),
                  backgroundColor: alert.type === 'success' ? "success.light" : "warning.light",
                  borderRadius: 1,
                }}
              >
                {alert.type === 'warning' && (
                  <AlertTriangle size={20} color={theme.palette.warning.main} />
                )}
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {alert.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alert.description}
                  </Typography>
                </Box>
              </Box>
            ))}

            <Box sx={{ marginTop: theme.spacing(2), display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ArrowRight size={16} />}
                href="/cobrancas"
              >
                Ir para Cobranças
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={processarCobrancasMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Cpu size={16} />}
                onClick={handleProcessarCobrancas}
                disabled={processarCobrancasMutation.isPending}
              >
                {processarCobrancasMutation.isPending ? 'Processando...' : 'Processar Cobranças com IA'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}