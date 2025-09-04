import { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const DRAWER_WIDTH = 280;

export function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', maxWidth: '100vw', overflow: 'hidden' }}>
      {/* Header */}
      <Header 
        onMenuClick={handleSidebarToggle}
      />

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={DRAWER_WIDTH}
        variant={isMobile ? 'temporary' : 'persistent'}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: 0, // Força o flex container a respeitar min-width
          bgcolor: 'background.default',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
          marginTop: '64px', // Height of AppBar
          padding: theme.spacing(3),
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto',
          maxWidth: '100%',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
