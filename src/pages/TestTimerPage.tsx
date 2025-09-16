import { Box, Typography, Button, Paper, Alert, LinearProgress } from '@mui/material';
import { Timer } from 'lucide-react';
import { useDataSync, useLocalData } from '../hooks/useDataSync';

/**
 * Página de demonstração do timer de 5 segundos
 * Mostra como o skeleton agora dura no mínimo 5 segundos
 */
export function TestTimerPage() {
  const { 
    isLoading, 
    hasInitialLoad, 
    error, 
    progress,
    loadAllData,
    refreshData 
  } = useDataSync();
  
  const { 
    franqueados, 
    cobrancas, 
    usuariosInternos 
  } = useLocalData();

  const handleForceLoad = () => {
    console.log('🔄 Forçando carregamento com timer de 5 segundos...');
    loadAllData();
  };

  const handleRefresh = () => {
    console.log('🔄 Refresh com timer de 5 segundos...');
    refreshData(true);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Timer size={32} />
        Teste Timer 5 Segundos
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Esta página demonstra o timer de 5 segundos implementado no sistema cache-first.
        Agora os skeletons e loading states duram no mínimo 5 segundos, evitando mudanças
        muito rápidas que causam desconforto visual.
      </Typography>

      {/* Status Atual */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status do Sistema
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Estado de Loading: {isLoading ? '✅ Ativo (mínimo 5s)' : '❌ Inativo'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dados Carregados: {hasInitialLoad ? '✅ Sim' : '❌ Não'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total de Registros: {franqueados.length + cobrancas.length + usuariosInternos.length}
          </Typography>
        </Box>

        {/* Barra de Progresso */}
        {isLoading && progress && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {progress.stage}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(progress.current / progress.total) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary">
              {progress.current}/{progress.total} etapas concluídas
            </Typography>
          </Box>
        )}

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Botões de Teste */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            onClick={handleForceLoad}
            disabled={isLoading}
            startIcon={<Timer size={16} />}
          >
            {isLoading ? 'Carregando...' : 'Testar Timer (5s)'}
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh com Timer'}
          </Button>
        </Box>
      </Paper>

      {/* Explicação do Timer */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          🕐 Como Funciona o Timer
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          O sistema agora implementa um timer mínimo de 5 segundos para todos os loading states:
        </Typography>
        
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <li>
            <Typography variant="body2">
              ⏱️ <strong>Tempo Mínimo:</strong> Skeleton sempre dura pelo menos 5 segundos
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              🚀 <strong>Sync Rápido:</strong> Se os dados carregam em 1s, aguarda mais 4s
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              🐌 <strong>Sync Lento:</strong> Se demora 8s, não adiciona tempo extra
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              👁️ <strong>UX Melhorada:</strong> Evita mudanças muito rápidas na interface
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              📊 <strong>Progresso Visual:</strong> Mostra "Finalizando carregamento..." nos últimos segundos
            </Typography>
          </li>
        </Box>
      </Paper>

      {/* Dados Carregados */}
      {hasInitialLoad && !isLoading && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📊 Dados Sincronizados
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>
                {franqueados.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
                Franqueados
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ color: 'secondary.contrastText', fontWeight: 'bold' }}>
                {cobrancas.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'secondary.contrastText' }}>
                Cobranças
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
              <Typography variant="h4" sx={{ color: 'success.contrastText', fontWeight: 'bold' }}>
                {usuariosInternos.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'success.contrastText' }}>
                Usuários Internos
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Instruções */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.light' }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'info.contrastText' }}>
          🧪 Como Testar
        </Typography>
        
        <Box component="ol" sx={{ pl: 2, m: 0, color: 'info.contrastText' }}>
          <li>
            <Typography variant="body2">
              Clique em "Testar Timer (5s)" e observe o loading
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Note que mesmo com poucos dados, o loading dura exatos 5 segundos
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Observe a barra de progresso e a mensagem "Finalizando carregamento..."
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Teste múltiplas vezes para ver a consistência
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Vá para outras páginas (ex: /cobrancas-cache) para ver o efeito em uso real
            </Typography>
          </li>
        </Box>
      </Paper>
    </Box>
  );
}