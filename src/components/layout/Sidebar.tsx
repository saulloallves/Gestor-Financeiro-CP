import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Collapse,
  Chip,
} from '@mui/material';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../../assets/logo-principal.png';

interface MenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  badge?: {
    value: number;
    color: 'error' | 'warning' | 'info' | 'success';
  };
  children?: MenuItem[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  width: number;
  variant: 'permanent' | 'persistent' | 'temporary';
}

// Configuração dos itens do menu
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    id: 'cobrancas',
    title: 'Cobranças',
    icon: CreditCard,
    path: '/cobrancas',
    badge: { value: 12, color: 'error' as const },
    children: [
      {
        id: 'cobrancas-pendentes',
        title: 'Pendentes',
        icon: Clock,
        path: '/cobrancas/pendentes',
        badge: { value: 8, color: 'warning' as const },
      },
      {
        id: 'cobrancas-vencidas',
        title: 'Vencidas',
        icon: AlertCircle,
        path: '/cobrancas/vencidas',
        badge: { value: 4, color: 'error' as const },
      },
      {
        id: 'cobrancas-pagas',
        title: 'Pagas',
        icon: CheckCircle,
        path: '/cobrancas/pagas',
      },
    ],
  },
  {
    id: 'franqueados',
    title: 'Franqueados',
    icon: Users,
    path: '/franqueados',
    children: [
      {
        id: 'franqueados-lista',
        title: 'Todos os Franqueados',
        icon: Users,
        path: '/franqueados/lista',
      },
      {
        id: 'franqueados-unidades',
        title: 'Unidades',
        icon: LayoutDashboard,
        path: '/franqueados/unidades',
      },
    ],
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    icon: BarChart3,
    path: '/relatorios',
    children: [
      {
        id: 'relatorios-financeiro',
        title: 'Financeiro',
        icon: TrendingUp,
        path: '/relatorios/financeiro',
      },
      {
        id: 'relatorios-inadimplencia',
        title: 'Inadimplência',
        icon: AlertCircle,
        path: '/relatorios/inadimplencia',
      },
    ],
  },
  {
    id: 'documentos',
    title: 'Documentos',
    icon: FileText,
    path: '/documentos',
  },
];

const settingsItems: MenuItem[] = [
  {
    id: 'configuracoes',
    title: 'Configurações',
    icon: Settings,
    path: '/configuracoes',
  },
];

export function Sidebar({ open, onClose, width, variant }: SidebarProps) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>(['cobrancas']);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      // Se tem filhos, expande/colapsa
      setExpandedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      // Se não tem filhos, navega
      navigate(item.path);
      if (variant === 'temporary') {
        onClose();
      }
    }
  };

  const isItemActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (item: MenuItem) => {
    if (isItemActive(item.path)) return true;
    if (item.children) {
      return item.children.some((child: MenuItem) => isItemActive(child.path));
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const Icon = item.icon;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isItemActive(item.path);
    const isParentActiveItem = isParentActive(item);

    return (
      <Box key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              pl: theme.spacing(2 + level * 2),
              pr: theme.spacing(2),
              py: theme.spacing(1.25),
              borderRadius: level === 0 ? '12px' : '8px',
              mx: level === 0 ? theme.spacing(1.5) : theme.spacing(1),
              mb: level === 0 ? theme.spacing(0.5) : theme.spacing(0.25),
              backgroundColor: isActive ? 'primary.main' : 'transparent',
              color: isActive ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                backgroundColor: isActive 
                  ? 'primary.dark' 
                  : level === 0 
                    ? 'action.hover' 
                    : 'action.selected',
                transform: 'translateX(2px)',
              },
              transition: theme.transitions.create(['background-color', 'transform'], {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            <ListItemIcon
              sx={{
                color: isActive ? 'primary.contrastText' : isParentActiveItem ? 'primary.main' : 'text.secondary',
                minWidth: 40,
              }}
            >
              <Icon size={level === 0 ? 22 : 18} />
            </ListItemIcon>

            <ListItemText 
              primary={item.title}
              primaryTypographyProps={{
                fontSize: level === 0 ? '0.95rem' : '0.875rem',
                fontWeight: isActive ? 600 : level === 0 ? 500 : 400,
              }}
            />

            {/* Badge */}
            {item.badge && (
              <Chip
                size="small"
                label={item.badge.value}
                color={item.badge.color}
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  mr: item.children ? 1 : 0,
                }}
              />
            )}

            {/* Expand/Collapse Icon */}
            {item.children && (
              <Box sx={{ color: 'text.secondary' }}>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </Box>
            )}
          </ListItemButton>
        </ListItem>

        {/* Submenu */}
        {item.children && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child: MenuItem) => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          p: theme.spacing(3, 2, 2, 2),
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="img"
          src={logoImage}
          alt="Logo"
          sx={{
            width: 40,
            height: 40,
            objectFit: 'contain',
          }}
        />
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'primary.main',
              lineHeight: 1.2,
            }}
          >
            Central Financeira
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            Gestão Autônoma com IA
          </Typography>
        </Box>
      </Box>

      {/* Main Menu */}
      <Box sx={{ flex: 1, py: theme.spacing(2), overflowY: 'auto' }}>
        <List component="nav" disablePadding>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>

        <Divider sx={{ mx: theme.spacing(2), my: theme.spacing(2) }} />

        {/* Settings Menu */}
        <List component="nav" disablePadding>
          {settingsItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: theme.spacing(2),
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.default',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.7rem',
            textAlign: 'center',
            display: 'block',
          }}
        >
          © 2025 Cresci e Perdi
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
