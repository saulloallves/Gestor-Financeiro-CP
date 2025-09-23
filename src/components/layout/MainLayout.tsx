import { Box, useTheme } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { SystemInitializer } from "../auth/SystemInitializer";
import { useState, useEffect } from "react";
import { realtimeService } from "../../services/realtimeService";

const SIDEBAR_WIDTH_COLLAPSED = 72;
const SIDEBAR_WIDTH_EXPANDED = 280;

export function MainLayout() {
  const theme = useTheme();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  const currentSidebarWidth =
    sidebarExpanded || sidebarPinned
      ? SIDEBAR_WIDTH_EXPANDED
      : SIDEBAR_WIDTH_COLLAPSED;

  // Inicializa o serviço de Realtime quando o layout é montado
  useEffect(() => {
    realtimeService.initializeLocalSubscriptions();

    // Limpa as assinaturas quando o layout é desmontado (ex: no logout)
    return () => {
      realtimeService.cleanupSubscriptions();
    };
  }, []); // O array vazio garante que isso rode apenas uma vez

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
              padding: theme.spacing(3),
              paddingTop: `calc(64px + ${theme.spacing(3)})`, // Header height + padding
              overflow: "auto",
              width: "100%",
              minHeight: "100vh",
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </SystemInitializer>
  );
}