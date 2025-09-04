// Formulário de Cadastro/Edição de Franqueados - Módulo 2.2
// Seguindo as diretrizes de design e arquitetura do projeto

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Autocomplete,
  Chip,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@mui/material/styles';
import { Save, X, User, Phone, MapPin, Briefcase, Building2, DollarSign, Search  } from 'lucide-react';
import { 
  useCreateFranqueado, 
  useUpdateFranqueado, 
  useUnidadesParaVinculo 
} from '../hooks/useFranqueados';
import { useEnderecoForm } from '../hooks/useEnderecoForm';
import { 
  validarCpf, 
  formatarCpf, 
  formatarTelefone, 
  validarTelefone 
} from '../utils/validations';
import type { 
  Franqueado, 
  CreateFranqueadoData, 
  UpdateFranqueadoData,
  UnidadeParaVinculo
} from '../types/franqueados';

// Schema de validação com Zod
const franqueadoSchema = z.object({
  // Dados Pessoais
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((cpf) => validarCpf(cpf), {
      message: 'CPF inválido'
    }),
  nacionalidade: z.string().optional(),
  data_nascimento: z.string().optional(),
  
  // Endereço
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_estado: z.string().optional(),
  endereco_cep: z.string().optional(),
  
  // Contatos
  telefone: z.string()
    .optional()
    .refine((telefone) => {
      if (!telefone || telefone.trim() === '') return true;
      return validarTelefone(telefone);
    }, {
      message: 'Telefone inválido'
    }),
  whatsapp: z.string()
    .optional()
    .refine((whatsapp) => {
      if (!whatsapp || whatsapp.trim() === '') return true;
      return validarTelefone(whatsapp);
    }, {
      message: 'WhatsApp inválido'
    }),
  email_pessoal: z.string()
    .min(1, 'Email pessoal é obrigatório')
    .email('Email inválido'),
  email_comercial: z.string().email('Email inválido').optional().or(z.literal('')),
  
  // Informações Contratuais
  tipo: z.enum(['principal', 'familiar', 'investidor', 'parceiro'] as const),
  prolabore: z.number().min(0, 'Pró-labore deve ser positivo').nullable().optional(),
  contrato_social: z.boolean(),
  disponibilidade: z.enum(['integral', 'parcial', 'eventos'] as const),
  
  // Histórico Profissional
  profissao_anterior: z.string().optional(),
  empreendedor_previo: z.boolean(),
  
  // Status
  status: z.enum(['ativo', 'inativo'] as const),
  
  // Vínculos
  unidades_vinculadas: z.array(z.string()).optional(),
});

type FranqueadoFormData = z.infer<typeof franqueadoSchema>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`franqueado-tabpanel-${index}`}
      aria-labelledby={`franqueado-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface FranqueadoFormProps {
  franqueado?: Franqueado;
  onSuccess?: (franqueado: Franqueado) => void;
  onCancel?: () => void;
}

export function FranqueadoForm({ franqueado, onSuccess, onCancel }: FranqueadoFormProps) {
  const theme = useTheme();
  const isEditing = !!franqueado;
  const [tabAtiva, setTabAtiva] = useState(0);
  
  const createMutation = useCreateFranqueado();
  const updateMutation = useUpdateFranqueado();
  const { data: unidadesDisponiveis = [], isLoading: isLoadingUnidades } = useUnidadesParaVinculo();
  
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<UnidadeParaVinculo[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<FranqueadoFormData>({
    resolver: zodResolver(franqueadoSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      nacionalidade: 'Brasileira',
      data_nascimento: '',
      endereco_rua: '',
      endereco_numero: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_estado: '',
      endereco_cep: '',
      telefone: '',
      whatsapp: '',
      email_pessoal: '',
      email_comercial: '',
      tipo: 'principal',
      prolabore: null,
      contrato_social: true,
      disponibilidade: 'integral',
      profissao_anterior: '',
      empreendedor_previo: false,
      status: 'ativo',
      unidades_vinculadas: [],
    },
  });

  // Hook para endereço com ViaCEP
  const {
    loading: loadingCep,
    handleCepChange,
    handleBuscarCep
  } = useEnderecoForm({
    setValue,
    cepFieldName: 'endereco_cep',
    ruaFieldName: 'endereco_rua',
    bairroFieldName: 'endereco_bairro',
    cidadeFieldName: 'endereco_cidade',
    estadoFieldName: 'endereco_estado',
    ufFieldName: 'endereco_estado',
  });

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Watch para mostrar/ocultar campo de pró-labore
  const tipoFranqueado = watch('tipo');
  const mostrarProlabore = tipoFranqueado === 'principal' || tipoFranqueado === 'familiar';

  // Carregar dados do franqueado para edição
  useEffect(() => {
    if (franqueado) {
      reset({
        nome: franqueado.nome,
        cpf: franqueado.cpf,
        nacionalidade: franqueado.nacionalidade || 'Brasileira',
        data_nascimento: franqueado.data_nascimento || '',
        endereco_rua: franqueado.endereco_rua || '',
        endereco_numero: franqueado.endereco_numero || '',
        endereco_bairro: franqueado.endereco_bairro || '',
        endereco_cidade: franqueado.endereco_cidade || '',
        endereco_estado: franqueado.endereco_estado || '',
        endereco_cep: franqueado.endereco_cep || '',
        telefone: franqueado.telefone || '',
        whatsapp: franqueado.whatsapp || '',
        email_pessoal: franqueado.email_pessoal || '',
        email_comercial: franqueado.email_comercial || '',
        tipo: franqueado.tipo,
        prolabore: franqueado.prolabore ?? null,
        contrato_social: franqueado.contrato_social,
        disponibilidade: franqueado.disponibilidade,
        profissao_anterior: franqueado.profissao_anterior || '',
        empreendedor_previo: franqueado.empreendedor_previo,
        status: franqueado.status,
        unidades_vinculadas: franqueado.unidades_vinculadas?.map(u => u.id) || [],
      });

      // Selecionar unidades vinculadas
      if (franqueado.unidades_vinculadas) {
        const unidadesVinculadas = franqueado.unidades_vinculadas.map(uv => ({
          id: uv.id,
          codigo_unidade: uv.codigo_unidade,
          nome_padrao: uv.nome_padrao,
          status: uv.status,
          franqueado_principal_id: undefined,
          franqueado_principal_nome: undefined
        }));
        setUnidadesSelecionadas(unidadesVinculadas);
      }
    }
  }, [franqueado, reset]);

  // Submissão do formulário
  const onSubmit = async (data: FranqueadoFormData) => {
    try {
      const formData = {
        ...data,
        email_pessoal: data.email_pessoal || undefined,
        email_comercial: data.email_comercial || undefined,
        prolabore: mostrarProlabore ? data.prolabore : undefined,
        unidades_vinculadas: unidadesSelecionadas.map(u => u.id),
      };

      if (isEditing) {
        const updatedFranqueado = await updateMutation.mutateAsync({
          id: franqueado.id,
          ...formData
        } as UpdateFranqueadoData);
        onSuccess?.(updatedFranqueado);
      } else {
        const newFranqueado = await createMutation.mutateAsync(formData as CreateFranqueadoData);
        onSuccess?.(newFranqueado);
      }
    } catch (error) {
      console.error('Erro no formulário:', error);
    }
  };

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <Box sx={{ padding: theme.spacing(3) }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: theme.spacing(3)
      }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {isEditing ? 'Editar Franqueado' : 'Novo Franqueado'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {isEditing 
              ? `Editando dados de ${franqueado.nome}` 
              : 'Cadastre um novo franqueado na rede'
            }
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<X size={20} />}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <Save size={20} />}
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isEditing ? 'Atualizar' : 'Salvar'}
          </Button>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tabs de Navegação */}
        <Card sx={{ marginBottom: theme.spacing(3) }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabAtiva}
              onChange={(_, newValue) => setTabAtiva(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                },
              }}
            >
              <Tab
                icon={<User size={20} />}
                iconPosition="start"
                label="Dados Pessoais"
                sx={{ gap: 1 }}
              />
              <Tab
                icon={<Phone size={20} />}
                iconPosition="start"
                label="Contatos"
                sx={{ gap: 1 }}
              />
              <Tab
                icon={<MapPin size={20} />}
                iconPosition="start"
                label="Endereço"
                sx={{ gap: 1 }}
              />
              <Tab
                icon={<Building2 size={20} />}
                iconPosition="start"
                label="Vínculos"
                sx={{ gap: 1 }}
              />
              <Tab
                icon={<Briefcase size={20} />}
                iconPosition="start"
                label="Informações Contratuais"
                sx={{ gap: 1 }}
              />
            </Tabs>
          </Box>

          <CardContent>
            {/* Aba 1 - Dados Pessoais */}
            <TabPanel value={tabAtiva} index={0}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome Completo"
                      required
                      error={!!errors.nome}
                      helperText={errors.nome?.message}
                      fullWidth
                      sx={{ gridColumn: 'span 2' }}
                    />
                  )}
                />
                
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="CPF"
                      required
                      placeholder="000.000.000-00"
                      error={!!errors.cpf}
                      helperText={errors.cpf?.message || 'Formato: 000.000.000-00'}
                      fullWidth
                      onChange={(e) => {
                        const valor = e.target.value;
                        const cpfFormatado = formatarCpf(valor);
                        field.onChange(cpfFormatado);
                      }}
                    />
                  )}
                />
                
                <Controller
                  name="nacionalidade"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nacionalidade"
                      error={!!errors.nacionalidade}
                      helperText={errors.nacionalidade?.message}
                      fullWidth
                    />
                  )}
                />
                
                <Controller
                  name="data_nascimento"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Data de Nascimento"
                      type="date"
                      error={!!errors.data_nascimento}
                      helperText={errors.data_nascimento?.message}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
                
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Status"
                      error={!!errors.status}
                      helperText={errors.status?.message}
                      fullWidth
                    >
                      <MenuItem value="ativo">Ativo</MenuItem>
                      <MenuItem value="inativo">Inativo</MenuItem>
                    </TextField>
                  )}
                />
              </Box>
            </TabPanel>

            {/* Aba 2 - Contatos */}
            <TabPanel value={tabAtiva} index={1}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                <Controller
                  name="telefone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Telefone"
                      placeholder="(11) 99999-9999"
                      error={!!errors.telefone}
                      helperText={errors.telefone?.message || 'Formato: (11) 99999-9999'}
                      fullWidth
                      onChange={(e) => {
                        const valor = e.target.value;
                        const telefoneFormatado = formatarTelefone(valor);
                        field.onChange(telefoneFormatado);
                      }}
                    />
                  )}
                />
                
                <Controller
                  name="whatsapp"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="WhatsApp"
                      placeholder="(11) 99999-9999"
                      error={!!errors.whatsapp}
                      helperText={errors.whatsapp?.message || 'Formato: (11) 99999-9999'}
                      fullWidth
                      onChange={(e) => {
                        const valor = e.target.value;
                        const whatsappFormatado = formatarTelefone(valor);
                        field.onChange(whatsappFormatado);
                      }}
                    />
                  )}
                />
                
                <Controller
                  name="email_pessoal"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="E-mail Pessoal"
                      type="email"
                      required
                      error={!!errors.email_pessoal}
                      helperText={errors.email_pessoal?.message}
                      fullWidth
                    />
                  )}
                />
                
                <Controller
                  name="email_comercial"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="E-mail Comercial"
                      type="email"
                      error={!!errors.email_comercial}
                      helperText={errors.email_comercial?.message}
                      fullWidth
                    />
                  )}
                />
              </Box>
            </TabPanel>

            {/* Aba 3 - Endereço */}
            <TabPanel value={tabAtiva} index={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                <Controller
                  name="endereco_cep"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="CEP"
                      placeholder="00000-000"
                      error={!!errors.endereco_cep}
                      helperText={errors.endereco_cep?.message || 'Digite o CEP para buscar automaticamente'}
                      fullWidth
                      onChange={(e) => {
                        handleCepChange(e.target.value, field.onChange);
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Box
                              component={Button}
                              onClick={() => {
                                const cep = (field.value || '').replace(/\D/g, '');
                                if (cep.length === 8) {
                                  handleBuscarCep(cep);
                                }
                              }}
                              disabled={loadingCep}
                              sx={{ minWidth: 0, padding: 0 }}
                              size="small"
                            >
                              {loadingCep ? (
                                <CircularProgress size={20} />
                              ) : (
                                <Search size={20} />
                              )}
                            </Box>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                />
                
                <Controller
                  name="endereco_rua"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Rua"
                      error={!!errors.endereco_rua}
                      helperText={errors.endereco_rua?.message}
                      fullWidth
                      sx={{ gridColumn: 'span 2' }}
                    />
                  )}
                />
                
                <Controller
                  name="endereco_numero"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Número"
                      error={!!errors.endereco_numero}
                      helperText={errors.endereco_numero?.message}
                      fullWidth
                    />
                  )}
                />
                
                <Controller
                  name="endereco_bairro"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Bairro"
                      error={!!errors.endereco_bairro}
                      helperText={errors.endereco_bairro?.message}
                      fullWidth
                    />
                  )}
                />
                
                <Controller
                  name="endereco_cidade"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Cidade"
                      error={!!errors.endereco_cidade}
                      helperText={errors.endereco_cidade?.message}
                      fullWidth
                    />
                  )}
                />
                
                <Controller
                  name="endereco_estado"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Estado"
                      error={!!errors.endereco_estado}
                      helperText={errors.endereco_estado?.message}
                      fullWidth
                    >
                      {estados.map((estado) => (
                        <MenuItem key={estado} value={estado}>
                          {estado}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>
            </TabPanel>

            {/* Aba 4 - Vínculos com Unidades */}
            <TabPanel value={tabAtiva} index={3}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Unidades Vinculadas
                </Typography>
                
                <Autocomplete
                  multiple
                  loading={isLoadingUnidades}
                  options={unidadesDisponiveis}
                  getOptionLabel={(option) => `${option.codigo_unidade} - ${option.nome_padrao}`}
                  value={unidadesSelecionadas}
                  onChange={(_, newValue) => {
                    setUnidadesSelecionadas(newValue);
                    setValue('unidades_vinculadas', newValue.map(u => u.id));
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        variant="outlined"
                        label={`${option.codigo_unidade} - ${option.nome_padrao}`}
                        {...getTagProps({ index })}
                        key={option.id}
                      />
                    ))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecione as Unidades"
                      placeholder="Digite para buscar unidades..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingUnidades ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                
                {unidadesSelecionadas.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {unidadesSelecionadas.length} unidade(s) selecionada(s)
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {unidadesSelecionadas.map((unidade) => (
                        <Chip
                          key={unidade.id}
                          label={`${unidade.codigo_unidade} - ${unidade.nome_padrao}`}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </TabPanel>

            {/* Aba 5 - Informações Contratuais */}
            <TabPanel value={tabAtiva} index={4}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Tipo de Franqueado"
                      error={!!errors.tipo}
                      helperText={errors.tipo?.message}
                      fullWidth
                    >
                      <MenuItem value="principal">Principal</MenuItem>
                      <MenuItem value="familiar">Sócio Familiar</MenuItem>
                      <MenuItem value="investidor">Investidor</MenuItem>
                      <MenuItem value="parceiro">Parceiro</MenuItem>
                    </TextField>
                  )}
                />
                
                <Controller
                  name="disponibilidade"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Disponibilidade"
                      error={!!errors.disponibilidade}
                      helperText={errors.disponibilidade?.message}
                      fullWidth
                    >
                      <MenuItem value="integral">Integral</MenuItem>
                      <MenuItem value="parcial">Parcial</MenuItem>
                      <MenuItem value="eventos">Apenas Eventos</MenuItem>
                    </TextField>
                  )}
                />
                
                {mostrarProlabore && (
                  <Controller
                    name="prolabore"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Pró-labore"
                        type="number"
                        error={!!errors.prolabore}
                        helperText={errors.prolabore?.message}
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DollarSign size={20} />
                            </InputAdornment>
                          ),
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || value === null) {
                            field.onChange(null);
                          } else {
                            const valor = parseFloat(value);
                            field.onChange(isNaN(valor) ? null : valor);
                          }
                        }}
                      />
                    )}
                  />
                )}
                
                <Controller
                  name="profissao_anterior"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Profissão Anterior"
                      error={!!errors.profissao_anterior}
                      helperText={errors.profissao_anterior?.message}
                      fullWidth
                    />
                  )}
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Controller
                    name="contrato_social"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Consta no Contrato Social"
                      />
                    )}
                  />
                  
                  <Controller
                    name="empreendedor_previo"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Já foi Empreendedor"
                      />
                    )}
                  />
                </Box>
              </Box>
            </TabPanel>
          </CardContent>
        </Card>

        {/* Alertas de erro */}
        {(createMutation.isError || updateMutation.isError) && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {createMutation.error?.message || updateMutation.error?.message}
          </Alert>
        )}
      </form>
    </Box>
  );
}