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
import { cobrancaFormSchema, editarCobrancaFormSchema, type CobrancaFormData } from '../utils/cobrancaSchemas';
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

// Função para formatar o valor como moeda para exibição
const formatCurrencyForDisplay = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export function CobrancaForm({ open, onClose, cobranca }: CobrancaFormProps) {
  const theme = useTheme();
  const criarCobranca = useCriarCobranca();
  const editarCobranca = useEditarCobranca();
  const criarCobrancaIntegrada = useCriarCobrancaIntegrada();
  const atualizarUrls = useAtualizarUrls();
  
  const isEdit = !!cobranca;

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

  // Usar schema diferente para criação e edição
  const formSchema = isEdit ? editarCobrancaFormSchema : cobrancaFormSchema;

  // --- FIX: Always use CobrancaFormData as generic, and cast resolver ---
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<CobrancaFormData>({
    resolver: zodResolver(formSchema) as any, // TypeScript workaround for union schema
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

      {/* FIX: Explicitly type handleSubmit for CobrancaFormData */}
      <form onSubmit={handleSubmit(onSubmit as any)}>
        <DialogContent sx={{ padding: theme.spacing(3) }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(3) }}>
            {/* ...rest of the component unchanged... */}
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