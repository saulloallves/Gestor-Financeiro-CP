import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPageCacheFirst } from "../pages/DashboardPageCacheFirst";
import { UnidadesPage } from "../pages/UnidadesPage";
import { FranqueadosPage } from "../pages/FranqueadosPage";
import { EquipesPage } from "../pages/EquipesPage";
import { UsuariosInternosPage } from "../pages/UsuariosInternosPage";
import { CobrancasPage } from "../pages/CobrancasPage";
import { ConfiguracoesPage } from "../pages/ConfiguracoesPage";
import { ConfiguracoesIAPage } from "../pages/ConfiguracoesIAPage";
import BaseConhecimentoPage from "../pages/BaseConhecimentoPage";
import { TesteCacheFirstPage } from "../pages/TesteCacheFirstPage";
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
        element: <DashboardPageCacheFirst />,
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
          <ProtectedRoute requiredType="interno">
            <EquipesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "usuarios-internos",
        element: (
          <ProtectedRoute requiredType="interno">
            <UsuariosInternosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "configuracoes",
        element: (
          <ProtectedRoute requiredType="interno">
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
          <ProtectedRoute requiredType="interno">
            <ConfiguracoesIAPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "teste-cache",
        element: (
          <ProtectedRoute requiredType="interno">
            <TesteCacheFirstPage />
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