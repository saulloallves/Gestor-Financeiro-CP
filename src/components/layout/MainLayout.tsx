import { Box, useTheme } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SystemInitializer } from "../auth/SystemInitializer";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { realtimeService } from "../../services/realtimeService";
import { FloatingChatButton } from "../chat/FloatingChatButton";
import { ChatWidgetModal } from "../chat/ChatWidgetModal";

const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_WIDTH_EXPANDED = 280;

export function MainLayout() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const location = useLocation(); // Hook para obter a localização atual
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  const currentSidebarWidth =
    sidebarExpanded || sidebarPinned
      ? SIDEBAR_WIDTH_EXPANDED
      : SIDEBAR_WIDTH_COLLAPSED;

  // Condição para mostrar o botão de chat
  const showFloatingChat = location.pathname !== '/chat-ia';

  // Inicializa os serviços de Realtime quando o layout é montado
  useEffect(() => {
    realtimeService.initialize(queryClient);

    // Limpa as assinaturas quando o layout é desmontado (ex: no logout)
    return () => {
      realtimeService.cleanup();
    };
  }, [queryClient]);

  return (
    <SystemInitializer>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          maxWidth: "100vw",
          overflow: "hidden",
        }}
      >
        {/* Sidebar - sempre visível */}
        <Sidebar
          onExpandedChange={setSidebarExpanded}
          onPinnedChange={setSidebarPinned}
          isPinned={sidebarPinned}
        />

        {/* Content Area - se adapta ao sidebar */}
        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            marginLeft: `${currentSidebarWidth}px`,
            transition: theme.transitions.create(["margin-left"], {
              duration: theme.transitions.duration.standard,
            }),
            minHeight: "100vh",
            maxWidth: `calc(100vw - ${currentSidebarWidth}px)`,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Header sidebarWidth={currentSidebarWidth} />

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: "background.default",
              // Padding centralizado para consistência em todas as telas
              padding: theme.spacing(3),
              paddingTop: `calc(80px + ${theme.spacing(3)})`, // Mantém o espaçamento do topo para o Header
              overflow: "auto",
              width: "100%",
              minHeight: "100vh",
            }}
          >
            <Outlet />
          </Box>
        </Box>

        {/* Componentes do Chat Flutuante (renderização condicional) */}
        {showFloatingChat && (
          <>
            <FloatingChatButton />
            <ChatWidgetModal />
          </>
        )}
      </Box>
    </SystemInitializer>
  );
}