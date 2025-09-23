import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper,
  Grid,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  RefreshCw,
  DownloadCloud,
  Trash2,
  Database,
  Clock,
  AlertCircle,
  Users,
  Building,
  CreditCard,
  UserCog,
} from 'lucide-react';
import { useDataSync } from '../hooks/useDataSync';
import { useDataStore } from '../store/dataStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TesteCacheFirstPage() {
  const theme = useTheme();
  const {
    isLoading,
    hasInitialLoad,
    lastSyncAt,
    error,
    progress,
    loadAllData,
    refreshData,
    clearCache,
  } = useDataSync();

  const { franqueados, unidades, cobrancas, usuariosInternos } = useDataStore();
  const [realtimeLog, setRealtimeLog] = useState<string[]>([]);

  // Inscreve-se nas mudanças de cobranças para exibir o log em tempo real
  useEffect(() => {
    const unsubscribe = useDataStore.subscribe(
      (state, prevState) => {
        if (state.cobrancas.length > prevState.cobrancas.length) {
          setRealtimeLog(prev => [`[${new Date().toLocaleTimeString()}] Nova cobrança adicionada!`, ...prev].slice(0, 10));
        } else if (state.cobrancas.length < prevState.cobrancas.length) {
          setRealtimeLog(prev => [`[${new Date().toLocaleTimeString()}] Cobrança removida!`, ...prev].slice(0, 10));
        } else if (JSON.stringify(state.cobrancas) !== JSON.stringify(prevState.cobrancas)) {
           setRealtimeLog(prev => [`[${new Date().toLocaleTimeString()}] Cobrança atualizada!`, ...prev].slice(0, 10));
        }
      }
    );
    return () => unsubscribe();
  }, []);


  const formatLastSync = () => {
    if (!lastSyncAt) return 'Nunca';
    try {
      const date = lastSyncAt instanceof Date ? lastSyncAt : new Date(lastSyncAt);
      return format(date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Página de Teste - Cache-First & Real-time
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Use esta página para monitorar e controlar o estado do cache local da aplicação.
      </Typography>

      <Grid container spacing={3}>
        {/* Coluna de Controle e Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Controles do Cache</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadCloud />}
                  onClick={() => loadAllData()}
                  disabled={isLoading}
                >
                  Forçar Carga Completa
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw />}
                  onClick={() => refreshData(true)}
                  disabled={isLoading}
                >
                  Forçar Sync Incremental
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Trash2 />}
                  onClick={clearCache}
                  disabled={isLoading}
                >
                  Limpar Cache Local
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Status da Sincronização</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Database size={20} />
                <Typography>
                  Status: {isLoading ? <Chip label="Sincronizando..." color="primary" size="small" /> : hasInitialLoad ? <Chip label="Sincronizado" color="success" size="small" /> : <Chip label="Não iniciado" size="small" />}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Clock size={20} />
                <Typography>Última Sincronização: {formatLastSync()}</Typography>
              </Box>
              {error && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                  <AlertCircle size={20} />
                  <Typography color="error">Erro: {error}</Typography>
                </Box>
              )}
              {progress && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">{progress.stage} ({progress.current}/{progress.total})</Typography>
                  <CircularProgress variant="determinate" value={(progress.current / progress.total) * 100} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Coluna de Dados */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Estatísticas do Cache</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}><Chip icon={<Users />} label={`Franqueados: ${franqueados.length}`} sx={{ width: '100%' }} /></Grid>
                <Grid item xs={6} sm={3}><Chip icon={<Building />} label={`Unidades: ${unidades.length}`} sx={{ width: '100%' }} /></Grid>
                <Grid item xs={6} sm={3}><Chip icon={<CreditCard />} label={`Cobranças: ${cobrancas.length}`} sx={{ width: '100%' }} /></Grid>
                <Grid item xs={6} sm={3}><Chip icon={<UserCog />} label={`Usuários: ${usuariosInternos.length}`} sx={{ width: '100%' }} /></Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Preview de Cobranças (Cache)</Typography>
                <List dense>
                  {cobrancas.slice(0, 5).map(c => (
                    <ListItem key={c.id} divider>
                      <ListItemText
                        primary={`UN ${c.codigo_unidade} - R$ ${c.valor_atualizado.toFixed(2)}`}
                        secondary={`Venc: ${new Date(c.vencimento).toLocaleDateString()} - Status: ${c.status}`}
                      />
                    </ListItem>
                  ))}
                  {cobrancas.length === 0 && <ListItem><ListItemText primary="Nenhuma cobrança no cache." /></ListItem>}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>Log de Eventos Real-time</Typography>
                <List dense>
                  {realtimeLog.map((log, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={log} />
                    </ListItem>
                  ))}
                  {realtimeLog.length === 0 && <ListItem><ListItemText primary="Aguardando eventos..." /></ListItem>}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}