import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
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
  Activity,
} from 'lucide-react';
import { useDataSync } from '../hooks/useDataSync';
import { useDataStore } from '../store/dataStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function TesteCacheFirstPage() {
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

  useEffect(() => {
    const unsubscribe = useDataStore.subscribe(
      (state, prevState) => {
        const now = `[${new Date().toLocaleTimeString()}]`;
        
        if (state.franqueados.length !== prevState.franqueados.length || JSON.stringify(state.franqueados) !== JSON.stringify(prevState.franqueados)) {
          setRealtimeLog(prev => [`${now} 📡 Cache de Franqueados atualizado via Realtime!`, ...prev].slice(0, 10));
        }
        if (state.unidades.length !== prevState.unidades.length || JSON.stringify(state.unidades) !== JSON.stringify(prevState.unidades)) {
          setRealtimeLog(prev => [`${now} 📡 Cache de Unidades atualizado via Realtime!`, ...prev].slice(0, 10));
        }
        if (state.cobrancas.length > prevState.cobrancas.length) {
          setRealtimeLog(prev => [`${now} 📝 Nova cobrança adicionada (local)!`, ...prev].slice(0, 10));
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
    } catch { return 'Data inválida'; }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>Painel de Controle: Cache & Real-time</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Monitore e controle o estado do cache local e as atualizações em tempo real.
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, 
        gap: 3 
      }}>
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Controles do Cache</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="contained" startIcon={<DownloadCloud />} onClick={() => loadAllData(true)} disabled={isLoading}>Forçar Carga Completa</Button>
                <Button variant="outlined" startIcon={<RefreshCw />} onClick={() => refreshData(true)} disabled={isLoading}>Forçar Sync Incremental</Button>
                <Button variant="outlined" color="error" startIcon={<Trash2 />} onClick={clearCache} disabled={isLoading}>Limpar Cache Local</Button>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Status da Sincronização</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><Database size={20} /><Typography>Status: {isLoading ? <Chip label="Sincronizando..." color="primary" size="small" /> : hasInitialLoad ? <Chip label="Sincronizado" color="success" size="small" /> : <Chip label="Não iniciado" size="small" />}</Typography></Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><Clock size={20} /><Typography>Última Sincronização: {formatLastSync()}</Typography></Box>
              {error && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}><AlertCircle size={20} /><Typography color="error">Erro: {error}</Typography></Box>}
              {progress && <Box sx={{ mt: 2 }}><Typography variant="body2">{progress.stage} ({progress.current}/{progress.total})</Typography></Box>}
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Estatísticas do Cache</Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, 
                gap: 2 
              }}>
                <Chip icon={<Users />} label={`Franqueados: ${franqueados.length}`} sx={{ width: '100%' }} />
                <Chip icon={<Building />} label={`Unidades: ${unidades.length}`} sx={{ width: '100%' }} />
                <Chip icon={<CreditCard />} label={`Cobranças: ${cobrancas.length}`} sx={{ width: '100%' }} />
                <Chip icon={<UserCog />} label={`Usuários: ${usuariosInternos.length}`} sx={{ width: '100%' }} />
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, 
            gap: 3 
          }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Live Data Preview (Franqueados)</Typography>
              <List dense>{franqueados.slice(0, 5).map(f => <ListItem key={f.id} divider><ListItemText primary={f.nome} secondary={`CPF: ${f.cpf}`} /></ListItem>)}{franqueados.length === 0 && <ListItem><ListItemText primary="Nenhum franqueado no cache." /></ListItem>}</List>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Activity size={20} />Log de Eventos Real-time</Typography>
              <List dense>{realtimeLog.map((log, index) => <ListItem key={index}><ListItemText primary={log} /></ListItem>)}{realtimeLog.length === 0 && <ListItem><ListItemText primary="Aguardando eventos..." /></ListItem>}</List>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}