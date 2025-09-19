import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';
import { useCriarCobranca, useEditarCobranca } from '../hooks/useCobrancas';
import type { Cobranca, TipoCobranca } from '../types/cobrancas';
import { useState } from 'react';

const schema = z.object({
  codigo_unidade: z.number().int().min(1000, 'Código deve ter 4 dígitos').max(9999, 'Código deve ter 4 dígitos'),
  tipo_cobranca: z.enum(['royalties', 'insumos', 'aluguel', 'eventual', 'taxa_franquia']),
  valor_original: z.number().positive('Valor deve ser maior que zero'),
  vencimento: z.date(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CobrancaFormProps {
  open: boolean;
  onClose: () => void;
  cobranca?: Cobranca;
}

const tiposCobranca: { value: TipoCobranca; label: string }[] = [
  { value: 'royalties', label: 'Royalties' },
  { value: 'insumos', label: 'Insumos' },
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'eventual', label: 'Eventual' },
  { value: 'taxa_franquia', label: 'Taxa de Franquia' },
];

export function CobrancaForm({ open, onClose, cobranca }: CobrancaFormProps) {
  const theme = useTheme();
  const criarCobranca = useCriarCobranca();
  const editarCobranca = useEditarCobranca();
  const [dataVencimento, setDataVencimento] = useState<Date | null>(
    cobranca ? new Date(cobranca.vencimento) : null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: cobranca
      ? {
          codigo_unidade: cobranca.codigo_unidade,
          tipo_cobranca: cobranca.tipo_cobranca,
          valor_original: cobranca.valor_original,
          vencimento: new Date(cobranca.vencimento),
          observacoes: cobranca.observacoes || '',
        }
      : undefined,
  });

  const isLoading = criarCobranca.isPending || editarCobranca.isPending;
  const isEdit = !!cobranca;

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await editarCobranca.mutateAsync({
          id: cobranca.id,
          dados: {
            tipo_cobranca: data.tipo_cobranca,
            valor_original: data.valor_original,
            vencimento: data.vencimento.toISOString(),
            observacoes: data.observacoes,
          },
        });
      } else {
        await criarCobranca.mutateAsync({
          codigo_unidade: data.codigo_unidade,
          tipo_cobranca: data.tipo_cobranca,
          valor_original: data.valor_original,
          vencimento: data.vencimento.toISOString(),
          observacoes: data.observacoes,
        });
      }
      
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar cobrança:', error);
    }
  };

  const handleClose = () => {
    reset();
    setDataVencimento(null);
    onClose();
  };

  const handleDateChange = (date: Date | null) => {
    setDataVencimento(date);
    if (date) {
      setValue('vencimento', date);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="h2" sx={{ color: 'primary.main' }}>
          {isEdit ? 'Editar Cobrança' : 'Nova Cobrança'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ padding: theme.spacing(3) }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(3) }}>
            {!isEdit && (
              <TextField
                label="Código da Unidade"
                fullWidth
                type="number"
                placeholder="Ex: 1116, 2546"
                inputProps={{ 
                  min: 1000,
                  max: 9999
                }}
                {...register('codigo_unidade', { 
                  valueAsNumber: true 
                })}
                error={!!errors.codigo_unidade}
                helperText={errors.codigo_unidade?.message || 'Digite o código de 4 dígitos da unidade'}
                disabled={isLoading}
              />
            )}

            <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
              <TextField
                select
                label="Tipo de Cobrança"
                sx={{ flex: 1 }}
                {...register('tipo_cobranca')}
                error={!!errors.tipo_cobranca}
                helperText={errors.tipo_cobranca?.message}
                disabled={isLoading}
              >
                <MenuItem value="">
                  <em>Selecione o tipo</em>
                </MenuItem>
                {tiposCobranca.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Valor Original"
                type="number"
                sx={{ flex: 1 }}
                inputProps={{ 
                  step: '0.01',
                  min: '0'
                }}
                {...register('valor_original', { 
                  valueAsNumber: true 
                })}
                error={!!errors.valor_original}
                helperText={errors.valor_original?.message}
                disabled={isLoading}
              />
            </Box>

            <DatePicker
              label="Data de Vencimento"
              value={dataVencimento}
              onChange={handleDateChange}
              disabled={isLoading}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.vencimento,
                  helperText: errors.vencimento?.message,
                },
              }}
            />

            <TextField
              label="Observações"
              multiline
              rows={4}
              fullWidth
              {...register('observacoes')}
              error={!!errors.observacoes}
              helperText={errors.observacoes?.message}
              disabled={isLoading}
            />

            {(criarCobranca.error || editarCobranca.error) && (
              <Alert severity="error">
                {criarCobranca.error?.message || editarCobranca.error?.message}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: theme.spacing(2, 3) }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isEdit ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
