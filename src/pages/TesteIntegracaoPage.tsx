import { Box, Typography, Paper, Button, Chip, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  User, 
  Database, 
  Zap, 
  CheckCircle, 
  RefreshCw,
  LogOut,
  Timer
} from 'lucide-react';
import { useAuthDataSync, useSystemReady } from '../hooks/useAuthDataSync';
import { useAuthStore } from '../store/authStore';

export function TesteIntegracaoPage() {
  const theme = useTheme();
  const { logout } = useAuthStore();
  const {
    isSyncLoading,
    hasSyncData,
    syncError,
    syncProgress,
    isAuthenticated,
    userType,
    user,
    forceSync,
    clearSyncData,
    isReady
  } = useAuthDataSync();
  
  const { statusMessage } = useSystemReady();

  const handleLogout = () => {
    logout();
  };

  const handleForceSync = () => {
    forceSync();
  };

  const handleClearCache = () => {
    clearSyncData();
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Zap size={32} />
        Integração Auth + Cache-First
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Esta página demonstra a integração completa entre autenticação e sistema cache-first.
        O sync automático acontece após o login e os dados ficam disponíveis instantaneamente.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle size={20} color={isReady ? theme.palette.success.main : theme.palette.grey[400]} />
            Status do Sistema
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={isReady ? 'Sistema Pronto' : 'Inicializando'}
              color={isReady ? 'success' : 'default'}
              variant={isReady ? 'filled' : 'outlined'}
            />
            <Chip
              label={statusMessage}
              color="info"
              variant="outlined"
            />
          </Box>

          {syncProgress && isSyncLoading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timer size={16} />
                <Typography variant="body2">
                  {syncProgress.stage} - {syncProgress.current}/{syncProgress.total}
                </Typography>
              </Box>
            </Alert>
          )}

          {syncError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Erro na sincronização: {syncError}
            </Alert>
          )}
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={20} />
              Autenticação
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Status: 
                <Chip
                  label={isAuthenticated ? 'Logado' : 'Não Logado'}
                  color={isAuthenticated ? 'success' : 'error'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>

            {user && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Usuário:</strong> {user.nome}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {user.email}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>Tipo:</strong> 
                  <Chip
                    label={userType === 'interno' ? 'Equipe Interna' : 'Franqueado'}
                    color={userType === 'interno' ? 'primary' : 'secondary'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </>
            )}

            <Button
              variant="outlined"
              color="error"
              startIcon={<LogOut size={16} />}
              onClick={handleLogout}
              disabled={!isAuthenticated}
            >
              Logout (limpa cache)
            </Button>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Database size={20} />
              Sistema Cache-First
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Dados Sincronizados: 
                <Chip
                  label={hasSyncData ? 'Sim' : 'Não'}
                  color={hasSyncData ? 'success' : 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sincronização: 
                <Chip
                  label={isSyncLoading ? 'Em Andamento' : 'Parada'}
                  color={isSyncLoading ? 'warning' : 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<RefreshCw size={16} />}
                onClick={handleForceSync}
                disabled={isSyncLoading}
                size="small"
              >
                Forçar Sync
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleClearCache}
                disabled={!hasSyncData || isSyncLoading}
                size="small"
              >
                Limpar Cache
              </Button>
            </Box>
          </Paper>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 Fluxo de Integração
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                1. Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usuário faz login via AuthStore
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                2. Sync Automático
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AuthStore inicia sync no DataStore
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                3. Loading Screen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SystemInitializer mostra progresso
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                4. App Pronta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dados disponíveis instantaneamente
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: 'primary.light' }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.contrastText' }}>
            🧪 Como Testar a Integração
          </Typography>
          
          <Box component="ol" sx={{ pl: 2, m: 0, color: 'primary.contrastText' }}>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Faça logout e login novamente - observe a tela de loading automática
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Navigate entre páginas (/cobrancas-cache) - dados instantâneos
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Teste "Forçar Sync" para ver o timer de 5 segundos
              </Typography>
            </li>
            <li>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Use "Limpar Cache" e "Forçar Sync" para simular estados
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                Observe que após logout o cache é limpo automaticamente
              </Typography>
            </li>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}