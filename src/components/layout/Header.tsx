import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Badge,
  IconButton,
} from '@mui/material';
import {
  Bell,
  Settings,
  LogOut,
  User,
  HelpCircle,
  CircleDollarSign,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  sidebarWidth: number;
}

export function Header({ sidebarWidth }: HeaderProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    handleProfileMenuClose();
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: `calc(100% - ${sidebarWidth}px)`,
        height: 80,
        left: `${sidebarWidth}px`,
        paddingTop: theme.spacing(1),
        zIndex: theme.zIndex.drawer - 1,
        transition: theme.transitions.create(['width', 'left'], {
          easing: theme.transitions.easing.easeInOut,
          duration: theme.transitions.duration.standard,
        }),
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: theme.spacing(2),
        }}
      >
        {/* Título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircleDollarSign 
            size={28} 
            style={{ color: theme.palette.text.primary }}
          />
          <Typography
            variant="h6"
            component="h1"
            sx={{
              fontWeight: 500,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Sistema de Cobrança Autônomo
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton
            size="large"
            color="inherit"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'primary.main',
              },
            }}
          >
            <Badge badgeContent={3} color="error">
              <Bell size={24} />
            </Badge>
          </IconButton>

          {/* Help */}
          <IconButton
            size="large"
            color="inherit"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'primary.main',
              },
            }}
          >
            <HelpCircle size={24} />
          </IconButton>

          {/* User Profile */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="profile-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            sx={{
              ml: 1,
              padding: theme.spacing(0.5),
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            mt: 1.5,
            minWidth: 220,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info */}
        <MenuItem disabled sx={{ opacity: 1, cursor: 'default' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {usuario?.nome || 'Usuário'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {'perfil' in usuario! ? usuario.perfil : 'Usuário'}
            </Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Menu Items */}
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <User size={20} />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Settings size={20} />
          </ListItemIcon>
          <ListItemText>Configurações</ListItemText>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
