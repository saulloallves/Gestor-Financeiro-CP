import { Box, Typography, LinearProgress, Paper, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Database, Users, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useSystemReady } from '../../hooks/useAuthDataSync';
import { useDataSync } from '../../hooks/useDataSync';

interface SystemInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skipAuthCheck?: boolean; // Nova prop para pular verificação de auth
}

/**
 * Componente que gerencia o estado de inicialização do sistema
 * Mostra loading enquanto sincroniza dados após login
 */
export function SystemInitializer({ children, fallback, skipAuthCheck = false }: SystemInitializerProps) {
  const theme = useTheme();
  const { isReady, isLoading, needsAuth, needsData, statusMessage } = useSystemReady();
  const { progress, error } = useDataSync();

  // Se skipAuthCheck é true, sempre renderiza os children (usado para rotas públicas)
  if (skipAuthCheck) {
    return <>{children}</>;
  }

  // Se o usuário não está autenticado, renderiza os children (irá redirecionar)
  if (needsAuth) {
    return <>{children}</>;
  }

  // Se está pronto, renderiza a aplicação normal
  if (isReady) {
    return <>{children}</>;
  }

  // Se há um fallback customizado e está carregando
  if (fallback && (isLoading || needsData)) {
    return <>{fallback}</>;
  }

  // Tela padrão de inicialização
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '90%',
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            {isLoading ? (
              <Loader2 size={32} color={theme.palette.primary.main} className="animate-spin" />
            ) : (
              <Database size={32} color={theme.palette.primary.main} />
            )}
          </Box>
          
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Inicializando Sistema
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {statusMessage}
          </Typography>
        </Box>

        {/* Progress Bar */}
        {progress && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={(progress.current / progress.total) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {progress.stage} ({progress.current}/{progress.total})
            </Typography>
          </Box>
        )}

        {/* Status Steps */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <CheckCircle2 size={20} color={theme.palette.success.main} />
            <Typography variant="body2" sx={{ ml: 1.5, color: 'success.main' }}>
              Autenticação concluída
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            {isLoading ? (
              <Loader2 size={20} color={theme.palette.primary.main} className="animate-spin" />
            ) : (
              <Users size={20} color={theme.palette.grey[400]} />
            )}
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 1.5, 
                color: isLoading ? 'primary.main' : 'text.secondary' 
              }}
            >
              Carregando dados dos usuários
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <FileText size={20} color={theme.palette.grey[400]} />
            <Typography variant="body2" sx={{ ml: 1.5, color: 'text.secondary' }}>
              Sincronizando cobranças e relatórios
            </Typography>
          </Box>
        </Box>

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Erro na sincronização: {error}
            </Typography>
          </Alert>
        )}

        {/* Loading Message */}
        {isLoading && (
          <Typography variant="caption" color="text.secondary">
            Isso pode levar alguns segundos...
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

/**
 * Versão minimalista para usar em overlays
 */
export function SystemInitializerMinimal() {
  const { isLoading, progress } = useDataSync();
  
  if (!isLoading) return null;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: 'background.paper',
        p: 2,
        borderRadius: 2,
        boxShadow: 3,
        minWidth: 200,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Loader2 size={16} className="animate-spin" />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Sincronizando...
        </Typography>
      </Box>
      
      {progress && (
        <LinearProgress
          variant="determinate"
          value={(progress.current / progress.total) * 100}
          sx={{ height: 4 }}
        />
      )}
    </Box>
  );
}