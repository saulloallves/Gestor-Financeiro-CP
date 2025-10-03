import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { UnidadesPage } from "../pages/UnidadesPage";
import { FranqueadosPage } from "../pages/FranqueadosPage";
import { EquipesPage } from "../pages/EquipesPage";
import { UsuariosInternosPage } from "../pages/UsuariosInternosPage";
import { CobrancasPage } from "../pages/CobrancasPage";
import { ConfiguracoesPage } from "../pages/ConfiguracoesPage";
import { ConfiguracoesIAPage } from "../pages/ConfiguracoesIAPage";
import BaseConhecimentoPage from "../pages/BaseConhecimentoPage";
import { OperacoesPage } from "../pages/OperacoesPage";
import { ChatIAPage } from "../pages/ChatIAPage";
import { TemplatesPage } from "../pages/TemplatesPage";
import { ComunicacoesLogPage } from "../pages/ComunicacoesLogPage";
import { PermissoesPage } from "../pages/PermissoesPage"; // Importa a nova página
import { MainLayout } from "../components/layout/MainLayout";
import {
  ProtectedRoute,
  UnauthorizedPage,
} from "../components/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "cobrancas",
        element: (
          <ProtectedRoute requiredType="interno">
            <CobrancasPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "unidades",
        element: (
          <ProtectedRoute requiredType="interno">
            <UnidadesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "franqueados",
        element: (
          <ProtectedRoute requiredType="interno">
            <FranqueadosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "equipes",
        element: (
          <ProtectedRoute requiredType="interno" requiredProfile="admin">
            <EquipesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "usuarios-internos",
        element: (
          <ProtectedRoute requiredType="interno" requiredProfile="admin">
            <UsuariosInternosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "configuracoes",
        element: (
          <ProtectedRoute requiredType="interno" requiredProfile="admin">
            <ConfiguracoesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "base-conhecimento",
        element: (
          <ProtectedRoute requiredType="interno">
            <BaseConhecimentoPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "configuracoes-ia",
        element: (
          <ProtectedRoute requiredType="interno" requiredProfile="admin">
            <ConfiguracoesIAPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "chat-ia",
        element: (
          <ProtectedRoute requiredType="interno">
            <ChatIAPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "templates",
        element: (
          <ProtectedRoute requiredType="interno">
            <TemplatesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "comunicacoes/log",
        element: (
          <ProtectedRoute requiredType="interno">
            <ComunicacoesLogPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "operacoes",
        element: (
          <ProtectedRoute requiredType="interno" requiredProfile="admin">
            <OperacoesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "permissoes", // Nova rota
        element: (
          <ProtectedRoute requiredType="interno" requiredProfile="admin">
            <PermissoesPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: "/unauthorized",
    element: <UnauthorizedPage />,
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);