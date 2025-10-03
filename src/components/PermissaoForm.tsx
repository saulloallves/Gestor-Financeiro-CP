import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  CircularProgress,
} from '@mui/material';
import { useEquipesAtivas } from '../hooks/useEquipes';
import { permissaoSchema, type PermissaoFormData, type Permissao } from '../types/permissoes';

interface PermissaoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PermissaoFormData) => void;
  permissao?: Permissao | null;
  isLoading?: boolean;
}

export function PermissaoForm({ open, onClose, onSubmit, permissao, isLoading }: PermissaoFormProps) {
  const { data: equipes, isLoading: isLoadingEquipes } = useEquipesAtivas();
  const isEditing = !!permissao;

  const { control, handleSubmit, formState: { errors, isValid }, reset } = useForm<PermissaoFormData>({
    resolver: zodResolver(permissaoSchema),
    mode: 'onChange',
    defaultValues: {
      recurso: '',
      perfil: null,
      equipe_id: null,
      permitido: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(permissao ? {
        recurso: permissao.recurso,
        perfil: permissao.perfil,
        equipe_id: permissao.equipe_id,
        permitido: permissao.permitido,
      } : {
        recurso: '',
        perfil: null,
        equipe_id: null,
        permitido: true,
      });
    }
  }, [open, permissao, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Editar Permissão' : 'Nova Permissão'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Controller
              name="recurso"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Recurso"
                  fullWidth
                  placeholder="formato: escopo:recurso:acao"
                  error={!!errors.recurso}
                  helperText={errors.recurso?.message || 'Ex: sidebar:cobrancas:view'}
                />
              )}
            />
            <Controller
              name="perfil"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.perfil}>
                  <InputLabel>Perfil (Opcional)</InputLabel>
                  <Select {...field} label="Perfil (Opcional)">
                    <MenuItem value=""><em>Nenhum</em></MenuItem>
                    <MenuItem value="operador">Operador</MenuItem>
                    <MenuItem value="gestor">Gestor</MenuItem>
                    <MenuItem value="juridico">Jurídico</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="equipe_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.equipe_id} disabled={isLoadingEquipes}>
                  <InputLabel>Equipe (Opcional)</InputLabel>
                  <Select {...field} label="Equipe (Opcional)">
                    <MenuItem value=""><em>Nenhuma</em></MenuItem>
                    {equipes?.map(equipe => (
                      <MenuItem key={equipe.id} value={equipe.id}>{equipe.nome_equipe}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="permitido"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Permitido" />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={isLoading || !isValid}>
            {isLoading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}