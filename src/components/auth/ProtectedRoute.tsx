import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useAuthStore } from "../../store/authStore";
import { useAuthState } from "../../hooks/useAuthState";
import { PrimeiraSenhaModal } from "./PrimeiraSenhaModal.tsx";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredType?: "interno" | "franqueado";
}

export function ProtectedRoute({
  children,
  requiredType,
}: ProtectedRouteProps) {
  const { usuario, tipoAcesso, initializeAuth } = useAuthStore();
  
  const {
    isLoading: isLoadingAuthState,
    precisaTrocarSenha,
    primeiroAcesso,
    senhaTemporaria,
    verificarPrimeiroAcesso
  } = useAuthState();

  useEffect(() => {
    if (!usuario) {
      initializeAuth();
    }
  }, [usuario, initializeAuth]);

  useEffect(() => {
    if (usuario && tipoAcesso === 'interno') {
      verificarPrimeiroAcesso();
    }
  }, [usuario, tipoAcesso, verificarPrimeiroAcesso]);

  if (isLoadingAuthState) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          backgroundColor: 'background.default'
        }}
      >
        <CircularProgress size={40} color="primary" />
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Verificando autenticação...
        </Typography>
      </Box>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requiredType && tipoAcesso !== requiredType) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (usuario && tipoAcesso === 'interno' && precisaTrocarSenha) {
    return (
      <>
        {children}
        <PrimeiraSenhaModal
          open={true}
          primeiroAcesso={primeiroAcesso}
          senhaTemporaria={senhaTemporaria}
        />
      </>
    );
  }

  return <>{children}</>;
}

// Componente para mostrar loading durante inicialização
export function AuthInitializer({ children }: { children: ReactNode }) {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Por enquanto, não mostra loading pois estamos em modo simulado
  // Em produção com Supabase real, poderia mostrar um spinner aqui
  return <>{children}</>;
}

// Página de não autorizado
export function UnauthorizedPage() {
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Box>
        <h1>Acesso Não Autorizado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
      </Box>
    </Box>
  );
}
