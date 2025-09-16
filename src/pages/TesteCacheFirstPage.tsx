import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { useDataSync, useLocalData } from '../hooks/useDataSync';
import { DataSyncModal, RefreshButton, SyncStatusChip } from '../components/loading';

/**
 * Página de teste para o sistema cache-first
 * Demonstra como usar os hooks e componentes do sistema
 */
export function TesteCacheFirstPage() {
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
    usuariosInternos,
    estatisticas 
  } = useLocalData();

  const handleForceLoad = () => {
    loadAllData();
  };

  const handleRefresh = () => {
    refreshData(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Teste Sistema Cache-First
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Esta página demonstra como usar o sistema de cache-first implementado.
        Os dados são carregados automaticamente no login e ficam disponíveis
        instantaneamente para consultas locais.
      </Typography>

      {/* Status do Sistema */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Status do Sistema
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Typography>Estado:</Typography>
          <SyncStatusChip />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={handleForceLoad}
            disabled={isLoading}
          >
            Forçar Carregamento
          </Button>
          
          <RefreshButton variant="button" force />
          
          <Button 
            variant="contained" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Atualizar Dados
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erro: {error}
          </Alert>
        )}

        {progress !== null && isLoading && (
          <Alert severity="info">
            Progresso: {Math.round((progress.current / progress.total) * 100)}% - {progress.stage}
          </Alert>
        )}
      </Paper>

      {/* Estatísticas dos Dados Carregados */}
      {hasInitialLoad && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados Carregados (Cache Local)
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Franqueados
              </Typography>
              <Typography variant="h5">
                {franqueados.length}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Cobranças
              </Typography>
              <Typography variant="h5">
                {cobrancas.length}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Usuários Internos
              </Typography>
              <Typography variant="h5">
                {usuariosInternos.length}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total em Aberto
              </Typography>
              <Typography variant="h5">
                R$ {(estatisticas.valorTotalEmAberto || 0).toLocaleString('pt-BR')}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Exemplos de Consultas Instantâneas */}
      {hasInitialLoad && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Exemplos de Consultas Instantâneas (sem loading)
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Cobranças Vencidas:
              </Typography>
              <Typography variant="body2">
                {estatisticas.cobrancasVencidas || 0} cobranças
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Primeira Cobrança (se existir):
              </Typography>
              <Typography variant="body2">
                {cobrancas.length > 0 
                  ? `ID: ${cobrancas[0].id.slice(-8)}, Valor: R$ ${cobrancas[0].valor_atualizado || 0}`
                  : 'Nenhuma cobrança encontrada'
                }
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Primeiro Franqueado (se existir):
              </Typography>
              <Typography variant="body2">
                {franqueados.length > 0 
                  ? `${franqueados[0].nome || franqueados[0].nome_completo || 'Nome não definido'}`
                  : 'Nenhum franqueado encontrado'
                }
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {!hasInitialLoad && !isLoading && (
        <Alert severity="warning">
          Sistema não carregado ainda. Clique em "Forçar Carregamento" para testar.
        </Alert>
      )}

      {/* Modal de Sincronização */}
      <DataSyncModal open={isLoading && progress !== null} />
    </Box>
  );
}