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
  LogOut,
  User,
  HelpCircle,
  CircleDollarSign,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { PerfilModal } from '../PerfilModal';
import { usePerfil } from '../../hooks/usePerfil';
import { RefreshButton } from '../loading/RefreshButton';

interface HeaderProps {
  sidebarWidth: number;
}

export function Header({ sidebarWidth }: HeaderProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();
  const { data: perfilData } = usePerfil();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenPerfilModal = () => {
    setPerfilModalOpen(true);
    handleProfileMenuClose();
  };

  const handleClosePerfilModal = () => {
    setPerfilModalOpen(false);
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
          {/* Sync Button */}
          <RefreshButton variant="icon" showLastSync force={true} />

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
              src={perfilData?.fotoPerfil || undefined}
            >
              {!perfilData?.fotoPerfil && (usuario?.nome?.charAt(0).toUpperCase() || 'U')}
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
        <MenuItem 
          sx={{ 
            opacity: '1 !important', 
            cursor: 'default',
            backgroundColor: 'transparent !important',
            '&:hover': {
              backgroundColor: 'transparent !important',
            },
            '&.Mui-focusVisible': {
              backgroundColor: 'transparent !important',
            },
            '&.Mui-disabled': {
              opacity: '1 !important',
            }
          }}
        >
          <Avatar 
            sx={{ bgcolor: 'primary.main', mr: 2, opacity: '1 !important' }}
            src={perfilData?.fotoPerfil || undefined}
          >
            {!perfilData?.fotoPerfil && (usuario?.nome?.charAt(0).toUpperCase() || 'U')}
          </Avatar>
          <Box sx={{ opacity: '1 !important' }}>
            <Typography variant="body1" sx={{ fontWeight: 600, opacity: '1 !important', color: 'text.primary' }}>
              {usuario?.nome || 'Usuário'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', opacity: '1 !important' }}>
              {perfilData?.equipe_nome || 'Sem equipe'}
            </Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Menu Items */}
        <MenuItem onClick={handleOpenPerfilModal}>
          <ListItemIcon>
            <User size={20} />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>


        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Modal de Perfil */}
      <PerfilModal 
        open={perfilModalOpen}
        onClose={handleClosePerfilModal}
      />
    </AppBar>
  );
}