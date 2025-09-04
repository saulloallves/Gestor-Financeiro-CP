// Formulário de Cadastro/Edição de Unidades - Módulo 2.1
// Seguindo as diretrizes de design e arquitetura do projeto

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '@mui/material/styles';
import { Save, X, Building2, User, MapPin, Clock } from 'lucide-react';
import { 
  useCreateUnidade, 
  useUpdateUnidade, 
  useFranqueados 
} from '../hooks/useUnidades';
import type { 
  Unidade, 
  CreateUnidadeData, 
  UpdateUnidadeData,
  FranqueadoPrincipal
} from '../types/unidades';

// Schema de validação com Zod
const unidadeSchema = z.object({
  nome_grupo: z.string().optional(),
  nome_padrao: z.string().min(1, 'Nome da unidade é obrigatório'),
  cnpj: z.string().optional(),
  
  // Contato
  telefone_comercial: z.string().optional(),
  email_comercial: z.string().email('Email inválido').optional().or(z.literal('')),
  instagram: z.string().optional(),
  
  // Endereço
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_estado: z.string().optional(),
  endereco_uf: z.string().max(2, 'UF deve ter 2 caracteres').optional(),
  endereco_cep: z.string().optional(),
  
  // Horários
  horario_seg_sex: z.string().optional(),
  horario_sabado: z.string().optional(),
  horario_domingo: z.string().optional(),
  
  // Status e configurações
  status: z.enum(['ativo', 'em_implantacao', 'suspenso', 'cancelado'] as const),
  multifranqueado: z.boolean(),
  
  // Franqueado principal
  franqueado_principal_id: z.string().optional(),
});

type UnidadeFormData = z.infer<typeof unidadeSchema>;

interface UnidadeFormProps {
  unidade?: Unidade;
  onSuccess?: (unidade: Unidade) => void;
  onCancel?: () => void;
}

export function UnidadeForm({ unidade, onSuccess, onCancel }: UnidadeFormProps) {
  const theme = useTheme();
  const isEditing = !!unidade;
  
  const createMutation = useCreateUnidade();
  const updateMutation = useUpdateUnidade();
  const { data: franqueados = [], isLoading: isLoadingFranqueados } = useFranqueados();
  
  const [selectedFranqueado, setSelectedFranqueado] = useState<FranqueadoPrincipal | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<UnidadeFormData>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      nome_grupo: '',
      nome_padrao: '',
      cnpj: '',
      telefone_comercial: '',
      email_comercial: '',
      instagram: '',
      endereco_rua: '',
      endereco_numero: '',
      endereco_complemento: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_estado: '',
      endereco_uf: '',
      endereco_cep: '',
      horario_seg_sex: '',
      horario_sabado: '',
      horario_domingo: '',
      status: 'ativo',
      multifranqueado: false,
      franqueado_principal_id: '',
    },
  });

  // Estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Carregar dados da unidade para edição
  useEffect(() => {
    if (unidade) {
      reset({
        nome_grupo: unidade.nome_grupo || '',
        nome_padrao: unidade.nome_padrao,
        cnpj: unidade.cnpj || '',
        telefone_comercial: unidade.telefone_comercial || '',
        email_comercial: unidade.email_comercial || '',
        instagram: unidade.instagram || '',
        endereco_rua: unidade.endereco_rua || '',
        endereco_numero: unidade.endereco_numero || '',
        endereco_complemento: unidade.endereco_complemento || '',
        endereco_bairro: unidade.endereco_bairro || '',
        endereco_cidade: unidade.endereco_cidade || '',
        endereco_estado: unidade.endereco_estado || '',
        endereco_uf: unidade.endereco_uf || '',
        endereco_cep: unidade.endereco_cep || '',
        horario_seg_sex: unidade.horario_seg_sex || '',
        horario_sabado: unidade.horario_sabado || '',
        horario_domingo: unidade.horario_domingo || '',
        status: unidade.status,
        multifranqueado: unidade.multifranqueado,
        franqueado_principal_id: unidade.franqueado_principal_id || '',
      });

      // Encontrar e selecionar o franqueado principal
      if (unidade.franqueado_principal_id) {
        const franqueado = franqueados.find(f => f.id === unidade.franqueado_principal_id);
        if (franqueado) {
          setSelectedFranqueado(franqueado);
        }
      }
    }
  }, [unidade, franqueados, reset]);

  // Submissão do formulário
  const onSubmit = async (data: UnidadeFormData) => {
    try {
      const formData = {
        ...data,
        email_comercial: data.email_comercial || undefined,
        franqueado_principal_id: data.franqueado_principal_id || undefined,
      };

      if (isEditing) {
        const updatedUnidade = await updateMutation.mutateAsync({
          id: unidade.id,
          ...formData
        } as UpdateUnidadeData);
        onSuccess?.(updatedUnidade);
      } else {
        const newUnidade = await createMutation.mutateAsync(formData as CreateUnidadeData);
        onSuccess?.(newUnidade);
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
            {isEditing ? 'Editar Unidade' : 'Nova Unidade'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {isEditing 
              ? `Código: ${unidade.codigo_unidade}` 
              : 'Código será gerado automaticamente'
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
        {/* Informações Básicas */}
        <Card sx={{ marginBottom: theme.spacing(3) }}>
          <CardHeader 
            avatar={<Building2 color={theme.palette.primary.main} />}
            title="Informações Básicas"
            sx={{ backgroundColor: 'background.default' }}
          />
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              <Controller
                name="nome_grupo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome do Grupo"
                    error={!!errors.nome_grupo}
                    helperText={errors.nome_grupo?.message}
                    fullWidth
                  />
                )}
              />
              
              <Controller
                name="nome_padrao"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome Padronizado da Unidade"
                    required
                    error={!!errors.nome_padrao}
                    helperText={errors.nome_padrao?.message}
                    fullWidth
                  />
                )}
              />
              
              <Controller
                name="cnpj"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="CNPJ"
                    error={!!errors.cnpj}
                    helperText={errors.cnpj?.message}
                    fullWidth
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
                    label="Status da Unidade"
                    error={!!errors.status}
                    helperText={errors.status?.message}
                    fullWidth
                  >
                    <MenuItem value="ativo">Ativo</MenuItem>
                    <MenuItem value="em_implantacao">Em Implantação</MenuItem>
                    <MenuItem value="suspenso">Suspenso</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                  </TextField>
                )}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Controller
                name="multifranqueado"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Multifranqueado"
                  />
                )}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Contato da Unidade */}
        <Card sx={{ marginBottom: theme.spacing(3) }}>
          <CardHeader 
            title="Contato da Unidade"
            sx={{ backgroundColor: 'background.default' }}
          />
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              <Controller
                name="telefone_comercial"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Telefone Comercial"
                    error={!!errors.telefone_comercial}
                    helperText={errors.telefone_comercial?.message}
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
              
              <Controller
                name="instagram"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Instagram"
                    error={!!errors.instagram}
                    helperText={errors.instagram?.message}
                    fullWidth
                  />
                )}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card sx={{ marginBottom: theme.spacing(3) }}>
          <CardHeader 
            avatar={<MapPin color={theme.palette.primary.main} />}
            title="Endereço"
            sx={{ backgroundColor: 'background.default' }}
          />
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
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
                name="endereco_complemento"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Complemento"
                    error={!!errors.endereco_complemento}
                    helperText={errors.endereco_complemento?.message}
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
                name="endereco_uf"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="UF"
                    error={!!errors.endereco_uf}
                    helperText={errors.endereco_uf?.message}
                    fullWidth
                  >
                    {estados.map((uf) => (
                      <MenuItem key={uf} value={uf}>
                        {uf}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              
              <Controller
                name="endereco_cep"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="CEP"
                    error={!!errors.endereco_cep}
                    helperText={errors.endereco_cep?.message}
                    fullWidth
                  />
                )}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Horários de Funcionamento */}
        <Card sx={{ marginBottom: theme.spacing(3) }}>
          <CardHeader 
            avatar={<Clock color={theme.palette.primary.main} />}
            title="Horários de Funcionamento"
            sx={{ backgroundColor: 'background.default' }}
          />
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              <Controller
                name="horario_seg_sex"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Segunda a Sexta"
                    placeholder="Ex: 09:00-18:00"
                    error={!!errors.horario_seg_sex}
                    helperText={errors.horario_seg_sex?.message}
                    fullWidth
                  />
                )}
              />
              
              <Controller
                name="horario_sabado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sábado"
                    placeholder="Ex: 09:00-14:00"
                    error={!!errors.horario_sabado}
                    helperText={errors.horario_sabado?.message}
                    fullWidth
                  />
                )}
              />
              
              <Controller
                name="horario_domingo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Domingo"
                    placeholder="Ex: Fechado"
                    error={!!errors.horario_domingo}
                    helperText={errors.horario_domingo?.message}
                    fullWidth
                  />
                )}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Franqueado Principal */}
        <Card sx={{ marginBottom: theme.spacing(3) }}>
          <CardHeader 
            avatar={<User color={theme.palette.primary.main} />}
            title="Franqueado Principal"
            sx={{ backgroundColor: 'background.default' }}
          />
          <CardContent>
            <Controller
              name="franqueado_principal_id"
              control={control}
              render={() => (
                <Autocomplete
                  loading={isLoadingFranqueados}
                  options={franqueados}
                  getOptionLabel={(option) => option.nome}
                  value={selectedFranqueado}
                  onChange={(_, newValue) => {
                    setSelectedFranqueado(newValue);
                    setValue('franqueado_principal_id', newValue?.id || '');
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecione o Franqueado Principal"
                      error={!!errors.franqueado_principal_id}
                      helperText={errors.franqueado_principal_id?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingFranqueados ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
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
