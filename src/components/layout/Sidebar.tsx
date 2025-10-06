import {
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
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Building,
  Pin,
  PinOff,
  Shield,
  UserCog,
  UserSearch,
  Settings,
  Database,
  MessageSquare,
  FileText,
  History,
  SlidersHorizontal,
  Key, // Ícone para permissões
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { Can } from '../auth'; // Importa o componente Can
import logoImage from "../../assets/logo cresci-header.png";
import cabecaIcon from "../../assets/cabeca.png";

interface MenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  path: string;
  badge?: {
    value: number;
    color: "error" | "warning" | "info" | "success";
  };
  children?: MenuItem[];
}

interface SidebarProps {
  onClose?: () => void;
  onExpandedChange?: (expanded: boolean) => void;
  onPinnedChange?: (pinned: boolean) => void;
  isPinned?: boolean;
}

// Larguras do sidebar
const SIDEBAR_WIDTH_COLLAPSED = 75;
const SIDEBAR_WIDTH_EXPANDED = 280;

// Configuração dos itens do menu
const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    id: "cobrancas",
    title: "Cobranças",
    icon: CreditCard,
    path: "/cobrancas",
  },
  {
    id: "consultas",
    title: "Consultas",
    icon: UserSearch,
    path: "/consultas",
    children: [
      {
        id: "unidades",
        title: "Unidades",
        icon: Building,
        path: "/unidades",
      },
      {
        id: "franqueados",
        title: "Franqueados",
        icon: Users,
        path: "/franqueados",
      },
    ],
  },
  {
    id: "comunicacoes",
    title: "Comunicações",
    icon: MessageSquare,
    path: "/comunicacoes",
    children: [
      {
        id: "templates",
        title: "Templates de Mensagem",
        icon: FileText,
        path: "/templates",
      },
      {
        id: "log",
        title: "Histórico de Envios",
        icon: History,
        path: "/comunicacoes/log",
      },
    ],
  },
  {
    id: "ia",
    title: "Inteligência Artificial",
    icon: BrainCircuit,
    path: "/ia",
    children: [
      {
        id: "chat-ia",
        title: "Chat com Agente",
        icon: MessageSquare,
        path: "/chat-ia",
      },
      {
        id: "base-conhecimento",
        title: "Base de Conhecimento",
        icon: Database,
        path: "/base-conhecimento",
      },
      {
        id: "configuracoes-ia",
        title: "Configurações de IA",
        icon: Settings,
        path: "/configuracoes-ia",
      },
    ],
  },
  {
    id: "administracao",
    title: "Administração",
    icon: Shield,
    path: "/administracao",
    children: [
      {
        id: "equipes",
        title: "Equipes",
        icon: Users,
        path: "/equipes",
      },
      {
        id: "usuarios-internos",
        title: "Usuários Internos",
        icon: UserCog,
        path: "/usuarios-internos",
      },
      {
        id: "permissoes", // Novo item de menu
        title: "Permissões de Acesso",
        icon: Key,
        path: "/permissoes",
      },
      {
        id: "configuracoes-cobrancas",
        title: "Configurações",
        icon: Settings,
        path: "/configuracoes",
      },
      {
        id: "operacoes",
        title: "Operações e Sistema",
        icon: SlidersHorizontal,
        path: "/operacoes",
      }
    ],
  },
];

export function Sidebar({
  onClose,
  onExpandedChange,
  onPinnedChange,
  isPinned = false,
}: SidebarProps) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([""]);

  // Estados para controle do sidebar
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // O sidebar está expandido quando está com hover OU fixo
  const isExpanded = isHovered || isPinned;
  const currentWidth = isExpanded
    ? SIDEBAR_WIDTH_EXPANDED
    : SIDEBAR_WIDTH_COLLAPSED;

  // Notifica mudanças de estado
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // Limpa o temporizador se o componente for desmontado
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      // Se tem filhos, expande/colapsa
      setExpandedItems((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      // Se não tem filhos, navega
      navigate(item.path);
      onClose?.();
    }
  };

  const handleTogglePin = () => {
    const newPinnedState = !isPinned;
    onPinnedChange?.(newPinnedState);
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = window.setTimeout(() => {
        setIsHovered(true);
      }, 500); // Atraso de 0.5 segundos
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      setIsHovered(false);
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
    const isItemExpanded = expandedItems.includes(item.id);
    const isActive = isItemActive(item.path);
    const isParentActiveItem = isParentActive(item);

    // No modo recolhido, só mostra itens de nível 0
    if (!isExpanded && level > 0) {
      return null;
    }

    return (
      <Can I="view" on={`sidebar:${item.id}`} key={item.id}>
        <Box>
          <ListItem disablePadding>
            <Tooltip title={!isExpanded ? item.title : ""} placement="right" arrow>
              <ListItemButton
                onClick={() => handleItemClick(item)}
                sx={{
                  pl: isExpanded ? theme.spacing(2 + level * 2) : theme.spacing(1.5),
                  pr: isExpanded ? theme.spacing(2) : theme.spacing(1.5),
                  py: theme.spacing(1.25),
                  borderRadius: level === 0 ? "12px" : "8px",
                  mx: theme.spacing(1),
                  mb: level === 0 ? theme.spacing(0.5) : theme.spacing(0.25),
                  backgroundColor: isActive ? "primary.main" : "transparent",
                  color: isActive ? "primary.contrastText" : "text.primary",
                  minHeight: 50,
                  justifyContent: isExpanded ? "flex-start" : "center",
                  "&:hover": {
                    backgroundColor: isActive ? "primary.dark" : level === 0 ? "action.hover" : "action.selected",
                    transform: "translateX(2px)",
                  },
                  transition: theme.transitions.create(["background-color", "transform", "padding"], {
                    duration: theme.transitions.duration.short,
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? "primary.contrastText" : isParentActiveItem ? "primary.main" : "text.secondary",
                    minWidth: isExpanded ? 40 : 24,
                    justifyContent: "center",
                  }}
                >
                  <Icon size={level === 0 ? 22 : 18} />
                </ListItemIcon>

                {isExpanded && (
                  <>
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontSize: level === 0 ? "0.95rem" : "0.875rem",
                        fontWeight: isActive ? 600 : level === 0 ? 500 : 400,
                      }}
                    />
                    {item.badge && (
                      <Chip
                        size="small"
                        label={item.badge.value}
                        color={item.badge.color}
                        sx={{
                          height: 20,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          mr: item.children ? 1 : 0,
                        }}
                      />
                    )}
                    {item.children && (
                      <Box sx={{ color: "text.secondary" }}>
                        {isItemExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </Box>
                    )}
                  </>
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          {item.children && isExpanded && (
            <Collapse in={isItemExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children.map((child: MenuItem) => renderMenuItem(child, level + 1))}
              </List>
            </Collapse>
          )}
        </Box>
      </Can>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.paper",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Box
        sx={{
          p: theme.spacing(2),
          display: "flex",
          alignItems: "center",
          justifyContent: isExpanded ? "space-between" : "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: 80,
          transition: theme.transitions.create(["padding", "justify-content"], {
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <Box
            component="img"
            src={isExpanded ? logoImage : cabecaIcon}
            alt="Cresci e Perdi"
            sx={{
              height: isExpanded ? 40 : 32,
              width: isExpanded ? "auto" : 100,
              objectFit: "contain",
              transition: theme.transitions.create(["height", "width"], {
                duration: theme.transitions.duration.standard,
              }),
            }}
          />
        </Box>

        {isExpanded && (
          <Tooltip title={isPinned ? "Desfixar sidebar" : "Fixar sidebar"} placement="bottom">
            <IconButton
              onClick={handleTogglePin}
              size="small"
              sx={{
                color: "text.primary",
                backgroundColor: isPinned ? "action.selected" : "transparent",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
                transition: theme.transitions.create(["background-color"], {
                  duration: theme.transitions.duration.short,
                }),
              }}
            >
              {isPinned ? <Pin size={18} /> : <PinOff size={18} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ flex: 1, py: theme.spacing(2), overflowY: "auto" }}>
        <List component="nav" disablePadding>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
        {isExpanded && <Divider sx={{ mx: theme.spacing(2), my: theme.spacing(2) }} />}
      </Box>

      {isExpanded && (
        <Box
          sx={{
            p: theme.spacing(2),
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: "background.default",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: "0.7rem",
              fontWeight: 900,
              textAlign: "center",
              display: "block",
            }}
          >
            Versão 1.0.0
            <br />© 2025 Cresci e Perdi
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      component="aside"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: currentWidth,
        zIndex: theme.zIndex.drawer,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        overflowX: 'hidden',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {drawerContent}
    </Box>
  );
}