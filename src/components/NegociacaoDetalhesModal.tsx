import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Bot, User } from 'lucide-react';
import { useNegociacaoDetalhes } from '../hooks/useNegociacoes';
import type { Negociacao } from '../types/negociacoes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import cabecaIcon from '../assets/cabeca.png';

interface NegociacaoDetalhesModalProps {
  open: boolean;
  onClose: () => void;
  negociacao: Negociacao | null;
}

export function NegociacaoDetalhesModal({ open, onClose, negociacao }: NegociacaoDetalhesModalProps) {
  const { data: interacoes, isLoading } = useNegociacaoDetalhes(negociacao?.id || null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Detalhes da Negociação - {negociacao?.franqueados?.nome} (Unidade {negociacao?.cobrancas?.codigo_unidade})
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
            {interacoes?.map((interacao) => (
              <Box
                key={interacao.id}
                sx={{
                  display: 'flex',
                  justifyContent: interacao.mensagem_enviada ? 'flex-start' : 'flex-end',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, maxWidth: '80%' }}>
                  {interacao.mensagem_enviada && (
                    <Avatar src={cabecaIcon} sx={{ width: 32, height: 32, bgcolor: 'transparent' }}><Bot size={20} /></Avatar>
                  )}
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      bgcolor: interacao.mensagem_enviada ? 'background.default' : 'primary.light',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      {format(new Date(interacao.data_hora), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {interacao.mensagem_enviada || interacao.mensagem_recebida}
                    </Typography>
                  </Paper>
                  {interacao.mensagem_recebida && (
                    <Avatar sx={{ width: 32, height: 32 }}><User size={20} /></Avatar>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}