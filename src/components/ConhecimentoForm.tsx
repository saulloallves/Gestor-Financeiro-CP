import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
} from '@mui/material';
import type { CriarBaseConhecimento, BaseConhecimento } from '../types/ia';

const conhecimentoSchema = z.object({
  titulo: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  categoria: z.enum(['cobrancas', 'juridico', 'negociacoes', 'relatorios', 'suporte']),
  conteudo: z.string().min(20, 'O conteúdo deve ter pelo menos 20 caracteres.'),
  palavras_chave: z.string().optional(),
});

type ConhecimentoFormData = z.infer<typeof conhecimentoSchema>;

interface ConhecimentoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CriarBaseConhecimento) => void;
  conhecimentoParaEditar?: BaseConhecimento | null;
}

export const ConhecimentoForm = ({ open, onClose, onSubmit, conhecimentoParaEditar }: ConhecimentoFormProps) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ConhecimentoFormData>({
    resolver: zodResolver(conhecimentoSchema),
    defaultValues: {
      titulo: '',
      categoria: 'cobrancas',
      conteudo: '',
      palavras_chave: '',
    },
  });

  // Atualizar form quando abrir modal para edição
  useEffect(() => {
    if (open && conhecimentoParaEditar) {
      reset({
        titulo: conhecimentoParaEditar.titulo,
        categoria: conhecimentoParaEditar.categoria,
        conteudo: conhecimentoParaEditar.conteudo,
        palavras_chave: conhecimentoParaEditar.palavras_chave?.join(', ') || '',
      });
    } else if (open && !conhecimentoParaEditar) {
      reset({
        titulo: '',
        categoria: 'cobrancas',
        conteudo: '',
        palavras_chave: '',
      });
    }
  }, [open, conhecimentoParaEditar, reset]);

  const handleFormSubmit = (data: ConhecimentoFormData) => {
    const palavrasChaveArray = data.palavras_chave?.split(',').map(p => p.trim()).filter(p => p) || [];
    
    onSubmit({
      ...data,
      palavras_chave: palavrasChaveArray,
      status: 'ativo', // Default status
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {conhecimentoParaEditar ? 'Editar Conhecimento' : 'Adicionar Novo Conhecimento'}
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Controller
              name="titulo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Título"
                  fullWidth
                  error={!!errors.titulo}
                  helperText={errors.titulo?.message}
                />
              )}
            />
            <FormControl fullWidth error={!!errors.categoria}>
              <InputLabel>Categoria</InputLabel>
              <Controller
                name="categoria"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Categoria">
                    <MenuItem value="cobrancas">Cobranças</MenuItem>
                    <MenuItem value="juridico">Jurídico</MenuItem>
                    <MenuItem value="negociacoes">Negociações</MenuItem>
                    <MenuItem value="relatorios">Relatórios</MenuItem>
                    <MenuItem value="suporte">Suporte</MenuItem>
                  </Select>
                )}
              />
            </FormControl>
            <Controller
              name="conteudo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Conteúdo"
                  multiline
                  rows={10}
                  fullWidth
                  error={!!errors.conteudo}
                  helperText={errors.conteudo?.message}
                />
              )}
            />
            <Controller
              name="palavras_chave"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Palavras-chave (separadas por vírgula)"
                  fullWidth
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Salvar</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
