import {
  Button,
  IconButton,
  Tooltip,
  Box,
  Chip,
} from '@mui/material';
import { RefreshCw, Clock } from 'lucide-react';
import { useDataSync } from '../../hooks/useDataSync';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RefreshButtonProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
  showLastSync?: boolean;
  force?: boolean;
  disabled?: boolean;
}

export function RefreshButton({
  variant = 'button',
  size = 'medium',
  showLastSync = false,
  force = false,
  disabled = false,
}: RefreshButtonProps) {
  const { 
    isLoading, 
    lastSyncAt, 
    refreshData, 
    hasInitialLoad 
  } = useDataSync();

  const handleRefresh = () => {
    refreshData(force);
  };

  const getLastSyncText = () => {
    if (!lastSyncAt) return 'Nunca sincronizado';
    
    try {
      return `há ${formatDistanceToNow(lastSyncAt, { 
        locale: ptBR,
        addSuffix: false 
      })}`;
    } catch {
      return 'Sincronização recente';
    }
  };

  const isDisabled = disabled || isLoading || !hasInitialLoad;

  if (variant === 'icon') {
    return (
      <Tooltip 
        title={
          isDisabled 
            ? 'Aguarde a sincronização' 
            : `Atualizar dados${showLastSync && lastSyncAt ? ` (${getLastSyncText()})` : ''}`
        }
      >
        <span>
          <IconButton
            onClick={handleRefresh}
            disabled={isDisabled}
            size={size}
            sx={{
              color: isLoading ? 'primary.main' : 'text.secondary',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <RefreshCw 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              style={{
                animation: isLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        variant="outlined"
        startIcon={
          <RefreshCw 
            size={16}
            style={{
              animation: isLoading ? 'spin 1s linear infinite' : 'none',
            }}
          />
        }
        onClick={handleRefresh}
        disabled={isDisabled}
        size={size}
        sx={{
          borderRadius: 2,
          fontWeight: 500,
          textTransform: 'none',
          minWidth: 'auto',
          px: 2,
          '&:hover': {
            backgroundColor: 'primary.main',
            color: 'white',
            borderColor: 'primary.main',
          },
        }}
      >
        {isLoading ? 'Sincronizando...' : 'Atualizar'}
      </Button>

      {showLastSync && lastSyncAt && (
        <Chip
          icon={<Clock size={14} />}
          label={getLastSyncText()}
          variant="outlined"
          size="small"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            backgroundColor: 'transparent',
            borderColor: 'divider',
            color: 'text.secondary',
            '& .MuiChip-icon': {
              color: 'text.secondary',
            },
          }}
        />
      )}
    </Box>
  );
}

interface SyncStatusChipProps {
  showIcon?: boolean;
  variant?: 'outlined' | 'filled';
}

export function SyncStatusChip({ 
  showIcon = true, 
  variant = 'outlined' 
}: SyncStatusChipProps) {
  const { isLoading, lastSyncAt, hasInitialLoad, error } = useDataSync();

  const getStatusProps = (): {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    icon?: React.ReactElement;
  } => {
    if (error) {
      return {
        label: 'Erro na sincronização',
        color: 'error' as const,
        icon: showIcon ? <RefreshCw size={14} /> : undefined,
      };
    }

    if (isLoading) {
      return {
        label: 'Sincronizando...',
        color: 'primary' as const,
        icon: showIcon ? (
          <RefreshCw 
            size={14} 
            style={{ animation: 'spin 1s linear infinite' }}
          />
        ) : undefined,
      };
    }

    if (!hasInitialLoad) {
      return {
        label: 'Aguardando sincronização',
        color: 'default' as const,
        icon: showIcon ? <Clock size={14} /> : undefined,
      };
    }

    if (lastSyncAt) {
      const timeDiff = Date.now() - lastSyncAt.getTime();
      const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutos

      return {
        label: isRecent ? 'Dados atualizados' : 'Dados podem estar desatualizados',
        color: isRecent ? 'success' : 'warning',
        icon: showIcon ? <Clock size={14} /> : undefined,
      };
    }

    return {
      label: 'Status desconhecido',
      color: 'default' as const,
      icon: showIcon ? <Clock size={14} /> : undefined,
    };
  };

  const statusProps = getStatusProps();

  return (
    <Chip
      label={statusProps.label}
      color={statusProps.color}
      icon={statusProps.icon}
      variant={variant}
      size="small"
      sx={{
        fontSize: '0.75rem',
        fontWeight: 500,
        '& .MuiChip-icon': {
          fontSize: '14px',
        },
      }}
    />
  );
}

// Adicionar CSS para a animação de rotação
const styles = `
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

// Injetar estilos se não existirem
if (typeof document !== 'undefined' && !document.getElementById('refresh-button-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'refresh-button-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}