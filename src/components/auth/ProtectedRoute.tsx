import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import { useAuthStore } from "../../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredType?: "interno" | "franqueado";
}

export function ProtectedRoute({
  children,
  requiredType,
}: ProtectedRouteProps) {
  const { usuario, tipoAcesso, initializeAuth } = useAuthStore();

  // Inicializa a autenticação quando o componente monta
  useEffect(() => {
    if (!usuario) {
      initializeAuth();
    }
  }, [usuario, initializeAuth]);

  // Se não tem usuário, redireciona para login
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Se tem tipo específico requerido e não confere, redireciona
  if (requiredType && tipoAcesso !== requiredType) {
    return <Navigate to="/unauthorized" replace />;
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
