import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
} from '@mui/material';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface BatchResult {
  success: number;
  skipped: number;
  failures: {
    id: string;
    codigo_unidade: number;
    error: string;
  }[];
}

interface BatchProgressModalProps {
  open: boolean;
  onClose: () => void;
  isLoading: boolean;
  results: BatchResult | null;
  totalSelected: number;
}

export function BatchProgressModal({
  open,
  onClose,
  isLoading,
  results,
  totalSelected,
}: BatchProgressModalProps) {
  const progressValue = results
    ? ((results.success + results.failures.length + results.skipped) / totalSelected) * 100
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isLoading ? 'Processando Boletos em Lote...' : 'Resultado do Processamento'}
      </DialogTitle>
      <DialogContent dividers>
        {isLoading && !results && (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography gutterBottom>
              Iniciando o processo para {totalSelected} cobrança(s)...
            </Typography>
            <LinearProgress sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Isso pode levar alguns minutos. Você pode fechar esta janela, o processo continuará em segundo plano.
            </Typography>
          </Box>
        )}
        {results && (
          <Box>
            <Typography gutterBottom>
              Processamento concluído para {totalSelected} cobrança(s).
            </Typography>
            <LinearProgress variant="determinate" value={progressValue} sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
              <Chip icon={<CheckCircle />} label={`${results.success} Sucessos`} color="success" />
              <Chip icon={<AlertTriangle />} label={`${results.skipped} Já processados`} color="info" />
              <Chip icon={<XCircle />} label={`${results.failures.length} Falhas`} color="error" />
            </Box>

            {results.failures.length > 0 && (
              <Paper variant="outlined" sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  <ListItem>
                    <Typography variant="subtitle2">Detalhes das Falhas:</Typography>
                  </ListItem>
                  {results.failures.map((failure) => (
                    <ListItem key={failure.id}>
                      <ListItemIcon>
                        <XCircle color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Unidade ${failure.codigo_unidade} (ID: ${failure.id})`}
                        secondary={failure.error}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}