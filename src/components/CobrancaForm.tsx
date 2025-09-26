import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  FormControlLabel,
  Checkbox,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Autocomplete,
  Paper,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';
import { useCriarCobranca, useEditarCobranca, useCriarCobrancaIntegrada } from '../hooks/useCobrancas';
import { useAtualizarUrls } from '../hooks/useUrls';
import { 
  useFranqueadosParaSelecao, 
  useUnidadesParaSelecao 
} from '../hooks/useClienteSelecao';
import type { Cobranca, TipoCobranca, ClienteSelecionado, TipoCliente } from '../types/cobrancas';
import { cobrancaFormSchema, type CobrancaFormData } from '../utils/cobrancaSchemas';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { formatarCpf, formatarCnpj } from '../utils/validations';

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
  const criarCobrancaIntegrada = useCriarCobrancaIntegrada();
  const atualizarUrls = useAtualizarUrls();
  
  // Estados para controle da interface
  const [dataVencimento, setDataVencimento] = useState<Date | null>(
    cobranca ? new Date(cobranca.vencimento.replace(/-/g, '/')) : null
  );
  const [criarNoAsaas, setCriarNoAsaas] = useState(false);
  const [tipoCliente, setTipoCliente] = useState<TipoCliente | ''>('');
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteSelecionado | null>(null);

  // Hooks para buscar dados
  const franqueadosQuery = useFranqueadosParaSelecao();
  const unidadesQuery = useUnidadesParaSelecao();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CobrancaFormData>({
    resolver: zodResolver(cobrancaFormSchema),
    mode: 'onChange',
    defaultValues: {
      criar_no_asaas: false,
      tipo_cobranca: undefined,
    },
  });

  // Observar mudanças no formulário
  const watchCriarNoAsaas = watch('criar_no_asaas');
  const watchTipoCliente = watch('tipo_cliente');

  // Sincronizar estados locais com o formulário
  useEffect(() => {
    setCriarNoAsaas(watchCriarNoAsaas || false);
  }, [watchCriarNoAsaas]);

  useEffect(() => {
    setTipoCliente(watchTipoCliente || '');
    // Limpar cliente selecionado quando mudar o tipo
    if (watchTipoCliente !== tipoCliente) {
      setClienteSelecionado(null);
      setValue('cliente_selecionado', undefined);
      setValue('franqueado_id', undefined);
      setValue('unidade_id', undefined);
    }
  }, [watchTipoCliente, setValue, tipoCliente]);

  // Resetar formulário quando a cobrança para edição mudar
  useEffect(() => {
    if (open && cobranca) {
      const vencimentoDate = new Date(cobranca.vencimento.replace(/-/g, '/'));
      reset({
        codigo_unidade: cobranca.codigo_unidade,
        tipo_cobranca: cobranca.tipo_cobranca as TipoCobranca,
        valor_original: cobranca.valor_original,
        vencimento: vencimentoDate,
        observacoes: cobranca.observacoes || '',
        criar_no_asaas: false,
      });
      setDataVencimento(vencimentoDate);
    } else if (open && !cobranca) {
      reset();
      setDataVencimento(null);
      setCriarNoAsaas(false);
      setTipoCliente('');
      setClienteSelecionado(null);
    }
  }, [open, cobranca, reset]);

  const isLoading = criarCobranca.isPending || editarCobranca.isPending || criarCobrancaIntegrada.isPending || atualizarUrls.isPending;
  const isEdit = !!cobranca;

  // Opções para seleção de clientes baseado no tipo
  const opcoesClientes = tipoCliente === 'cpf' 
    ? franqueadosQuery.data || [] 
    : tipoCliente === 'cnpj' 
    ? unidadesQuery.data || [] 
    : [];

  const isLoadingClientes = tipoCliente === 'cpf' 
    ? franqueadosQuery.isLoading 
    : tipoCliente === 'cnpj' 
    ? unidadesQuery.isLoading 
    : false;

  // Funções de manipulação
  const handleClienteSelecionado = (cliente: ClienteSelecionado | null) => {
    setClienteSelecionado(cliente);
    setValue('cliente_selecionado', cliente || undefined);
    
    if (cliente) {
      if (cliente.tipo === 'cpf') {
        setValue('franqueado_id', cliente.id as string);
        setValue('unidade_id', undefined);
      } else {
        setValue('unidade_id', cliente.id as number);
        setValue('franqueado_id', undefined);
      }
    } else {
      setValue('franqueado_id', undefined);
      setValue('unidade_id', undefined);
    }
  };

  const onSubmit = async (data: CobrancaFormData) => {
    try {
      const vencimentoString = format(data.vencimento, 'yyyy-MM-dd');
      if (isEdit) {
        await editarCobranca.mutateAsync({
          id: cobranca.id,
          dados: {
            tipo_cobranca: data.tipo_cobranca,
            valor_original: data.valor_original,
            vencimento: vencimentoString,
            observacoes: data.observacoes,
          },
        });
      } else {
        if (data.criar_no_asaas) {
          await criarCobrancaIntegrada.mutateAsync(data);
        } else {
          await criarCobranca.mutateAsync({
            codigo_unidade: data.codigo_unidade,
            tipo_cobranca: data.tipo_cobranca,
            valor_original: data.valor_original,
            vencimento: vencimentoString,
            observacoes: data.observacoes,
          });
        }
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
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="h2" sx={{ color: 'primary.main' }}>
          {isEdit ? 'Editar Cobrança' : 'Nova Cobrança'}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ padding: theme.spacing(3) }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(3) }}>
            
            {/* Seção: Dados Básicos */}
            <Box>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                📋 Dados da Cobrança
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(2) }}>
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
                  <Controller
                    name="tipo_cobranca"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        select
                        label="Tipo de Cobrança"
                        sx={{ flex: 1 }}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
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
                    )}
                  />

                  <TextField
                    label="Valor da Cobrança"
                    type="number"
                    sx={{ flex: 1 }}
                    inputProps={{ 
                      min: 0.01,
                      step: 0.01
                    }}
                    {...register('valor_original', { 
                      valueAsNumber: true 
                    })}
                    error={!!errors.valor_original}
                    helperText={errors.valor_original?.message}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: theme.spacing(2) }}>
                  <DatePicker
                    label="Data de Vencimento"
                    value={dataVencimento}
                    onChange={handleDateChange}
                    disabled={isLoading}
                    sx={{ flex: 1 }}
                    slotProps={{
                      textField: {
                        error: !!errors.vencimento,
                        helperText: errors.vencimento?.message || 'Selecione a data de vencimento',
                      },
                    }}
                  />
                </Box>

                <TextField
                  label="Observações"
                  multiline
                  rows={3}
                  placeholder="Informações adicionais sobre a cobrança..."
                  {...register('observacoes')}
                  error={!!errors.observacoes}
                  helperText={errors.observacoes?.message}
                  disabled={isLoading}
                />
              </Box>
            </Box>

            {/* Seção: Integração ASAAS (só para criação) */}
            {!isEdit && (
              <>
                <Divider />
                <Box>
                  <Typography variant="h6" sx={{ color: 'primary.main', mb: 2 }}>
                    🏦 Integração ASAAS
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...register('criar_no_asaas')}
                        disabled={isLoading}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">
                          Criar cobrança no ASAAS
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gera automaticamente boleto, PIX e link de pagamento
                        </Typography>
                      </Box>
                    }
                  />

                  {/* Campos condicionais para integração ASAAS */}
                  {criarNoAsaas && (
                    <Box sx={{ mt: 3, pl: 4, borderLeft: `3px solid ${theme.palette.primary.main}` }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main' }}>
                        👤 Seleção do Cliente
                      </Typography>

                      {/* Tipo de Cliente */}
                      <FormControl component="fieldset" sx={{ mb: 3 }}>
                        <FormLabel component="legend" sx={{ mb: 1 }}>
                          Tipo de Documento
                        </FormLabel>
                        <RadioGroup
                          row
                          value={tipoCliente}
                          onChange={(e) => {
                            const valor = e.target.value as TipoCliente;
                            setTipoCliente(valor);
                            setValue('tipo_cliente', valor);
                          }}
                        >
                          <FormControlLabel 
                            value="cpf" 
                            control={<Radio />} 
                            label="CPF (Franqueado)" 
                            disabled={isLoading}
                          />
                          <FormControlLabel 
                            value="cnpj" 
                            control={<Radio />} 
                            label="CNPJ (Unidade)" 
                            disabled={isLoading}
                          />
                        </RadioGroup>
                        {errors.tipo_cliente && (
                          <Typography variant="caption" color="error">
                            {errors.tipo_cliente.message}
                          </Typography>
                        )}
                      </FormControl>

                      {/* Seleção de Cliente */}
                      {tipoCliente && (
                        <Autocomplete
                          options={opcoesClientes}
                          value={clienteSelecionado}
                          onChange={(_, value) => handleClienteSelecionado(value)}
                          getOptionLabel={(option) => option.nome}
                          loading={isLoadingClientes}
                          disabled={isLoading}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={tipoCliente === 'cpf' ? 'Selecionar Franqueado' : 'Selecionar Unidade'}
                              placeholder={`Digite para buscar ${tipoCliente === 'cpf' ? 'franqueados' : 'unidades'}...`}
                              error={!!errors.cliente_selecionado}
                              helperText={errors.cliente_selecionado?.message}
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <>
                                    {isLoadingClientes ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <Typography variant="body1">{option.nome}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {option.tipo === 'cpf' 
                                    ? formatarCpf(option.documento)
                                    : formatarCnpj(option.documento)
                                  }
                                  {option.email && ` • ${option.email}`}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                          noOptionsText={
                            isLoadingClientes 
                              ? 'Carregando...' 
                              : `Nenhum ${tipoCliente === 'cpf' ? 'franqueado' : 'unidade'} encontrado`
                          }
                        />
                      )}

                      {/* Preview do Cliente Selecionado */}
                      {clienteSelecionado && (
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            mt: 2, 
                            p: 2, 
                            backgroundColor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900' 
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1, color: 'primary.main' }}>
                            ✅ Cliente Selecionado
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={clienteSelecionado.nome} 
                              color="primary" 
                              variant="outlined" 
                            />
                            <Chip 
                              label={clienteSelecionado.tipo === 'cpf' 
                                ? formatarCpf(clienteSelecionado.documento)
                                : formatarCnpj(clienteSelecionado.documento)
                              } 
                              size="small" 
                            />
                            {clienteSelecionado.email && (
                              <Chip 
                                label={clienteSelecionado.email} 
                                size="small" 
                                variant="outlined" 
                              />
                            )}
                          </Box>
                        </Paper>
                      )}
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: theme.spacing(2, 3) }}>
          {(criarCobranca.error || editarCobranca.error || criarCobrancaIntegrada.error) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {criarCobranca.error?.message || editarCobranca.error?.message || criarCobrancaIntegrada.error?.message}
            </Alert>
          )}
          
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