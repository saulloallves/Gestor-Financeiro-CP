import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';
import { useDataSync } from '../../hooks/useDataSync';

interface DataSyncModalProps {
  open: boolean;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function DataSyncModal({ 
  open, 
  onClose, 
  showCloseButton = false 
}: DataSyncModalProps) {
  const theme = useTheme();
  const { 
    isLoading, 
    progress, 
    error, 
    stats,
    refreshData,
    clearCache 
  } = useDataSync();

  const progressPercentage = progress 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  const handleRetry = () => {
    refreshData(true);
  };

  const handleClearCache = () => {
    clearCache();
    if (onClose) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={showCloseButton ? onClose : undefined}
      disableEscapeKeyDown={!showCloseButton}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          padding: theme.spacing(2),
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', padding: theme.spacing(4) }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Ícone principal */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {error ? (
              <AlertCircle 
                size={48} 
                color={theme.palette.error.main}
              />
            ) : (
              <Database 
                size={48} 
                color={theme.palette.primary.main}
              />
            )}
          </Box>

          {/* Título */}
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            {error ? 'Erro na Sincronização' : 'Sincronizando Dados'}
          </Typography>

          {/* Conteúdo baseado no estado */}
          {error ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="error" sx={{ textAlign: 'left' }}>
                {error}
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshCw size={16} />}
                  onClick={handleRetry}
                  sx={{ borderRadius: 2 }}
                >
                  Tentar Novamente
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleClearCache}
                  sx={{ borderRadius: 2 }}
                >
                  Limpar Cache
                </Button>
              </Box>
            </Box>
          ) : isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Progresso */}
              {progress ? (
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 1
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      {progress.stage}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {progressPercentage}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      },
                    }}
                  />
                  
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ mt: 1, display: 'block' }}
                  >
                    {progress.current} de {progress.total} etapas
                  </Typography>
                </Box>
              ) : (
                <CircularProgress size={40} thickness={4} />
              )}

              <Typography variant="body2" color="text.secondary">
                Baixando dados do servidor...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" color="success.main" sx={{ fontWeight: 500 }}>
                ✅ Sincronização concluída!
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-around',
                backgroundColor: theme.palette.grey[50],
                borderRadius: 2,
                padding: 2
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    {stats.franqueados}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Franqueados
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    {stats.cobrancas}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cobranças
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    {stats.usuariosInternos}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Usuários
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Botão de fechar (opcional) */}
          {showCloseButton && onClose && (
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: 2, mt: 2 }}
            >
              Fechar
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}