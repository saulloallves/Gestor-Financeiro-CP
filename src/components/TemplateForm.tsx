import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { templateSchema, type TemplateFormData, type Template } from '../types/comunicacao';

interface TemplateFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TemplateFormData) => void;
  template?: Template | null;
  isLoading?: boolean;
}

export function TemplateForm({ open, onClose, onSubmit, template, isLoading }: TemplateFormProps) {
  const { control, handleSubmit, formState: { errors, isValid }, reset } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (open) {
      reset(template ? {
        nome: template.nome,
        canal: template.canal,
        conteudo: template.conteudo,
        ativo: template.ativo,
      } : {
        nome: '',
        canal: 'whatsapp',
        conteudo: '',
        ativo: true,
      });
    }
  }, [open, template, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Controller
              name="nome"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Nome do Template" fullWidth error={!!errors.nome} helperText={errors.nome?.message} />
              )}
            />
            <Controller
              name="canal"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Canal</InputLabel>
                  <Select {...field} label="Canal">
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="email">E-mail</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="conteudo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Conteúdo do Template"
                  multiline
                  rows={10}
                  fullWidth
                  error={!!errors.conteudo}
                  helperText="Use variáveis como {{nome}}, {{valor}}, {{vencimento}}, {{link_boleto}}."
                />
              )}
            />
            <Controller
              name="ativo"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Ativo" />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isLoading || !isValid}>
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}