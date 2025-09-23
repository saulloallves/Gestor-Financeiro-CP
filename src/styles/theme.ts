import { createTheme } from "@mui/material/styles";

// Paleta de cores da sua marca
const brandColors = {
  primary: "#FFC31A", // Amarelo Principal da Marca
  secondary: "#E3A024", // Um tom mais escuro de amarelo para secundário
  success: "#2E7D32", // Verde para sucesso
  error: "#C62828", // Vermelho para erros
  warning: "#F9A825", // Amarelo para alertas
  info: "#1565C0", // Um azul mais claro para informações
  background: "#F4F6F8", // Um cinza bem claro para o fundo
  text: "#212121", // Cor de texto principal
};

const theme = createTheme({
  palette: {
    primary: {
      main: brandColors.primary,
    },
    secondary: {
      main: brandColors.secondary,
    },
    success: {
      main: brandColors.success,
    },
    error: {
      main: brandColors.error,
    },
    warning: {
      main: brandColors.warning,
    },
    info: {
      main: brandColors.info,
    },
    background: {
      default: brandColors.background,
      paper: "#FFFFFF", // Fundo de componentes como o Card
    },
    text: {
      primary: brandColors.text,
    },
  },
  typography: {
    fontFamily: "Poppins, sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none", // Para que os botões não fiquem em MAIÚSCULAS
      fontWeight: 500,
    },
  },
  // Você também pode customizar componentes globalmente aqui
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Remove a sombra padrão dos botões
      },
      styleOverrides: {
        root: {
          borderRadius: 8, // Arredonda as bordas dos botões
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
