import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useDataStore } from '../store/dataStore';
import { useTestTemplate } from '../hooks/useTemplates';
import type { Template } from '../types/comunicacao';
import type { Cobranca } from '../types/cobrancas';

interface TestTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template?: Template | null;
}

export function TestTemplateModal({ open, onClose, template }: TestTemplateModalProps) {
  const { cobrancas } = useDataStore();
  const [selectedCobranca, setSelectedCobranca] = useState<Cobranca | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const testMutation = useTestTemplate();

  const handleTest = async () => {
    if (!template || !selectedCobranca) {
      return;
    }
    await testMutation.mutateAsync({
      cobranca_id: selectedCobranca.id,
      template_name: template.nome,
      phone_number: phoneNumber || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Testar Template: {template?.nome}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 3, mt: 1 }}>
          <Typography variant="body1">
            Selecione uma cobrança para usar como dados de teste. A mensagem será enviada para o número padrão ou o número que você especificar.
          </Typography>
          <Autocomplete
            options={cobrancas}
            getOptionLabel={(option) => `ID: ${option.id.substring(0, 8)} - Unidade: ${option.codigo_unidade} - Valor: R$ ${option.valor_atualizado}`}
            value={selectedCobranca}
            onChange={(_, newValue) => setSelectedCobranca(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecione uma Cobrança"
                placeholder="Buscar cobrança..."
              />
            )}
          />
          <TextField
            label="Número de Telefone (Opcional)"
            placeholder="Padrão: 5511981996294"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={testMutation.isPending}>Cancelar</Button>
        <Button
          onClick={handleTest}
          variant="contained"
          disabled={!selectedCobranca || testMutation.isPending}
        >
          {testMutation.isPending ? <CircularProgress size={24} /> : 'Enviar Teste'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}