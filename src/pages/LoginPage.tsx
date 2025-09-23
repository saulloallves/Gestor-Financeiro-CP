import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Container,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Users, Building2 } from "lucide-react";
import logoPrincipal from "../assets/logo-principal.png";
import { FormularioLoginInterno } from "../components/ui/FormularioLoginInterno";
import { FormularioLoginFranqueado } from "../components/ui/FormularioLoginFranqueado";
import { useAuthStore } from "../store/authStore";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const [tabAtiva, setTabAtiva] = useState(0);

  // Redireciona para o dashboard se já estiver logado
  useEffect(() => {
    if (usuario) {
      navigate("/dashboard", { replace: true });
    }
  }, [usuario, navigate]);

  const handleMudancaTab = (_: React.SyntheticEvent, novaTab: number) => {
    setTabAtiva(novaTab);
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        flexGrow: 1,
        flexShrink: 0.8,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 600,
        }}
      >
        {/* Logo e Título */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: theme.spacing(4),
          }}
        >
          <img
            src={logoPrincipal}
            alt="Logo Cresci e Perdi"
            style={{
              maxWidth: "200px",
              height: "auto",
              marginBottom: theme.spacing(2),
            }}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{
              color: "text.primary",
              fontWeight: 600,
              textAlign: "center",
              marginBottom: theme.spacing(1),
            }}
          >
            Gestor Financeiro CP
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            Sistema de Gestão de Cobranças
          </Typography>
        </Box>

        {/* Card de Login */}
        <Card
          sx={{
            boxShadow: theme.shadows[8],
            borderRadius: theme.spacing(2),
            overflow: "hidden",
          }}
        >
          {/* Abas */}
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <Tabs
              value={tabAtiva}
              onChange={handleMudancaTab}
              variant="fullWidth"
              sx={{
                "& .MuiTab-root": {
                  minHeight: 64,
                  fontSize: "1rem",
                  fontWeight: 500,
                  textTransform: "none",
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                },
              }}
            >
              <Tab
                icon={<Users size={20} />}
                iconPosition="start"
                label="Acesso Interno"
                id="login-tab-0"
                aria-controls="login-tabpanel-0"
                sx={{
                  gap: theme.spacing(1),
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                }}
              />
              <Tab
                icon={<Building2 size={20} />}
                iconPosition="start"
                label="Acesso Franqueado"
                id="login-tab-1"
                aria-controls="login-tabpanel-1"
                sx={{
                  gap: theme.spacing(1),
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                }}
              />
            </Tabs>
          </Box>

          {/* Conteúdo dos Formulários */}
          <CardContent
            sx={{
              padding: theme.spacing(4),
              minHeight: 380,
            }}
          >
            <TabPanel value={tabAtiva} index={0}>
              <FormularioLoginInterno />
            </TabPanel>

            <TabPanel value={tabAtiva} index={1}>
              <FormularioLoginFranqueado />
            </TabPanel>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <Box
          sx={{
            textAlign: "center",
            marginTop: theme.spacing(3),
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            © 2025 Cresci e Perdi. Todos os direitos reservados.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
