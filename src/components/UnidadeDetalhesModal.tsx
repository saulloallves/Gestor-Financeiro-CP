import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Info, Clock } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { UnidadeInfoBasicas } from './UnidadeInfoBasicas';
import { UnidadeTimeline } from './UnidadeTimeline';

interface UnidadeDetalhesModalProps {
  open: boolean;
  onClose: () => void;
  codigoUnidade: number | null;
}

export function UnidadeDetalhesModal({ open, onClose, codigoUnidade }: UnidadeDetalhesModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const { unidades, cobrancas, sync } = useDataStore();

  const { unidade, cobrancasDaUnidade } = useMemo(() => {
    if (!codigoUnidade) return { unidade: null, cobrancasDaUnidade: [] };

    const foundUnidade = unidades.find(u => u.codigo_unidade === String(codigoUnidade));
    const foundCobrancas = cobrancas
      .filter(c => c.codigo_unidade === codigoUnidade)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { unidade: foundUnidade || null, cobrancasDaUnidade: foundCobrancas };
  }, [codigoUnidade, unidades, cobrancas]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {unidade ? `Detalhes da Unidade: ${unidade.nome_padrao}` : 'Carregando...'}
      </DialogTitle>
      <DialogContent dividers>
        {sync.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : unidade ? (
          <Box>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab icon={<Info />} iconPosition="start" label="Informações Básicas" value="info" />
              <Tab icon={<Clock />} iconPosition="start" label="Linha do Tempo" value="timeline" />
            </Tabs>
            {activeTab === 'info' && <UnidadeInfoBasicas unidade={unidade} />}
            {activeTab === 'timeline' && <UnidadeTimeline cobrancas={cobrancasDaUnidade} />}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            Unidade com código {codigoUnidade} não encontrada no cache.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}