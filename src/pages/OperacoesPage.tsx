import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  LinearProgress,
  Divider,
  Alert,
} from '@mui/material';
import {
  RefreshCw,
  DownloadCloud,
  Trash2,
  Database,
  Clock,
  AlertCircle,
  Cpu,
  Wrench,
  GitMerge,
} from 'lucide-react';
import { useDataSync } from '../hooks/useDataSync';
import { useMatrizSync } from '../hooks/useMatrizSync';
import { useProcessarCobrancas } from '../hooks/useCobrancas';
import { UsuariosInternosService } from '../api/usuariosInternosService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function OperacoesPage() {
  const {
    isLoading: isSyncLoading,
    lastSyncAt,
    error: syncError,
    progress,
    refreshData,
    clearCache,
  } = useDataSync();

  const matrizSync = useMatrizSync();
  const processarCobrancasMutation = useProcessarCobrancas();
  const [isCleaningOrphans, setIsCleaningOrphans] = useState(false);

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Nunca';
    try {
      const date = lastSyncAt instanceof Date ? lastSyncAt : new Date(lastSyncAt);
      return format(date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch { return 'Data inválida'; }
  };

  const handleLimparOrfaos = async () => {
    if (!window.confirm("Tem certeza que deseja limpar usuários órfãos? Esta ação não pode ser desfeita.")) {
      return;
    }
    setIsCleaningOrphans(true);
    try {
      const resultado = await UsuariosInternosService.limparUsuariosOrfaos();
      if (resultado.success) {
        toast.success(`Limpeza concluída! ${resultado.deleted_count || 0} usuários órfãos removidos.`);
      } else {
        toast.error(`Erro na limpeza: ${resultado.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      toast.error('Erro ao executar limpeza de usuários órfãos');
    } finally {
      setIsCleaningOrphans(false);
    }
  };

  const handleFormatarCnpjs = () => {
    if (window.confirm("Esta é uma ferramenta de debug para formatar CNPJs. Deseja continuar?")) {
      toast.success('Função de formatação de CNPJ executada (simulação).');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>Central de Operações e Sistema</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Ferramentas administrativas para sincronização de dados, execução de processos manuais e manutenção do sistema.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        
        {/* Card de Sincronização */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Status e Sincronização de Dados</Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><Clock size={16} /><Typography variant="body2">Última Sincronização: {formatLastSync()}</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Database size={16} /><Typography>Status: {isSyncLoading ? 'Sincronizando...' : 'Ocioso'}</Typography></Box>
              {syncError && <Alert severity="error" sx={{ mt: 1 }}>{syncError}</Alert>}
              {progress && <Box sx={{ mt: 1 }}><LinearProgress variant="determinate" value={(progress.current / progress.total) * 100} /><Typography variant="caption">{progress.stage}</Typography></Box>}
            </Paper>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="outlined" startIcon={<RefreshCw />} onClick={() => refreshData(true)} disabled={isSyncLoading}>Sincronização Incremental</Button>
              <Button variant="contained" color="secondary" startIcon={<GitMerge />} onClick={matrizSync.startSync} disabled={matrizSync.isLoading}>Sincronização Completa (Matriz)</Button>
              <Button variant="outlined" color="error" startIcon={<Trash2 />} onClick={() => { if (window.confirm("Tem certeza que deseja limpar todo o cache local?")) clearCache(); }} disabled={isSyncLoading}>Limpar Cache Local</Button>
            </Box>
          </CardContent>
        </Card>

        {/* Card de Automação */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Automação e Agentes de IA</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Execute processos automatizados manualmente.
            </Typography>
            <Button
              variant="contained"
              startIcon={processarCobrancasMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Cpu />}
              onClick={() => processarCobrancasMutation.mutate()}
              disabled={processarCobrancasMutation.isPending}
            >
              {processarCobrancasMutation.isPending ? 'Processando...' : 'Processar Cobranças com IA'}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
              O sistema também executa esta tarefa automaticamente a cada 30 minutos.
            </Typography>
          </CardContent>
        </Card>

        {/* Card de Manutenção */}
        <Card sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Manutenção de Dados</Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Use estas ferramentas com cautela. Elas realizam alterações diretas no banco de dados.
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Wrench />}
                onClick={handleFormatarCnpjs}
              >
                Formatar CNPJs (Debug)
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={isCleaningOrphans ? <CircularProgress size={16} /> : <Trash2 />}
                onClick={handleLimparOrfaos}
                disabled={isCleaningOrphans}
              >
                {isCleaningOrphans ? 'Limpando...' : 'Limpar Usuários Órfãos'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}