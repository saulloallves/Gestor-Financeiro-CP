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
import { useUnidades } from '../hooks/useUnidades';
import { useCriarCobranca, useEditarCobranca } from '../hooks/useCobrancas';
import type { Cobranca, TipoCobranca } from '../types/cobrancas';
import { useState } from 'react';

const schema = z.object({
  unidade_id: z.string().min(1, 'Selecione uma unidade'),
  tipo_cobranca: z.enum(['royalties', 'insumos', 'aluguel', 'eventual']),
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
];

export function CobrancaForm({ open, onClose, cobranca }: CobrancaFormProps) {
  const theme = useTheme();
  const { data: unidades } = useUnidades();
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
          unidade_id: cobranca.unidade_id,
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
          unidade_id: data.unidade_id,
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
                select
                label="Unidade"
                fullWidth
                {...register('unidade_id')}
                error={!!errors.unidade_id}
                helperText={errors.unidade_id?.message}
                disabled={isLoading}
              >
                <MenuItem value="">
                  <em>Selecione uma unidade</em>
                </MenuItem>
                {unidades?.data?.map((unidade) => (
                  <MenuItem key={unidade.id} value={unidade.id}>
                    {unidade.codigo_unidade} - {unidade.nome_padrao}
                  </MenuItem>
                ))}
              </TextField>
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
