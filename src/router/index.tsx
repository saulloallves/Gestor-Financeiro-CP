import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { UnidadesPage } from "../pages/UnidadesPage";
import { FranqueadosPage } from "../pages/FranqueadosPage";
import { EquipesPage } from "../pages/EquipesPage";
import { UsuariosInternosPage } from "../pages/UsuariosInternosPage";
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
        path: "admin",
        element: (
          <ProtectedRoute requiredType="interno">
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "franqueado",
        element: (
          <ProtectedRoute requiredType="franqueado">
            <DashboardPage />
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
