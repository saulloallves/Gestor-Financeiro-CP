import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export function DashboardPage() {
  const theme = useTheme();
  const { usuario } = useAuthStore();

  const cardData = [
    {
      title: "Total a Receber",
      value: "R$ 147.350,00",
      change: "+12,5%",
      icon: DollarSign,
      color: "primary.main" as const,
    },
    {
      title: "Receitas do Mês",
      value: "R$ 89.240,00",
      change: "+8,3%",
      icon: TrendingUp,
      color: "success.main" as const,
    },
    {
      title: "Franqueados Ativos",
      value: "48",
      change: "+3",
      icon: Users,
      color: "secondary.main" as const,
    },
    {
      title: "Cobranças Pendentes",
      value: "23",
      change: "-5",
      icon: Clock,
      color: "warning.main" as const,
    },
  ];

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      {/* Header do Dashboard */}
      <Box sx={{ marginBottom: theme.spacing(4) }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            marginBottom: theme.spacing(1),
          }}
        >
          Bem-vindo, {usuario?.nome || "Usuário"}!
        </Typography>
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
          const IconComponent = card.icon;
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
                  <Chip
                    label={card.change}
                    size="small"
                    color={card.change.startsWith("+") ? "success" : "error"}
                    variant="outlined"
                  />
                </Box>
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
              </CardContent>
            </Card>
          );
        })}
      </Box>

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
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                padding: theme.spacing(2),
                backgroundColor: "success.light",
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  ✓ Sistema funcionando normalmente
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Todas as funcionalidades estão operacionais
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                padding: theme.spacing(2),
                backgroundColor: "warning.light",
                borderRadius: 1,
              }}
            >
              <AlertTriangle size={20} color={theme.palette.warning.main} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  5 cobranças requerem atenção
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verificar cobranças vencidas no painel de gestão
                </Typography>
              </Box>
            </Box>

            <Box sx={{ marginTop: theme.spacing(2) }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<ArrowRight size={16} />}
                sx={{ marginRight: theme.spacing(1) }}
              >
                Ir para Cobranças
              </Button>
              <Button variant="outlined" color="primary">
                Gerar Relatório
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
