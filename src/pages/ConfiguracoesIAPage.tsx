import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Save, 
  BrainCircuit,
  TestTube,
  Bot,
  Key,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { useAIModels } from '../hooks/useAIModels';
import { useIaPrompts, useUpdateIaPrompt } from '../hooks/useIaPrompts';
import type { AtualizarConfiguracaoData } from '../types/configuracoes';
import type { IAProvider, IaPrompt } from '../types/ia';

// Schema para configurações globais do provedor
const providerSchema = z.object({
  ia_provedor: z.enum(['openai', 'lambda'] as const),
  ia_api_key: z.string().min(10, "Chave de API parece curta demais").optional().or(z.literal('')),
});
type ProviderForm = z.infer<typeof providerSchema>;

// Schema para o formulário de edição de prompt
const promptSchema = z.object({
  modelo_ia: z.string().min(1, "Modelo é obrigatório"),
  prompt_base: z.string().min(50, "O prompt base deve ter no mínimo 50 caracteres."),
});
type PromptForm = z.infer<typeof promptSchema>;

export function ConfiguracoesIAPage() {
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  // Hooks para configurações globais
  const { configuracao, isLoading: isLoadingConfig, error: errorConfig, atualizar, isUpdating: isUpdatingConfig } = useConfiguracoes();
  
  // Hooks para prompts
  const { data: prompts, isLoading: isLoadingPrompts } = useIaPrompts();
  const updatePromptMutation = useUpdateIaPrompt();

  // Hooks para modelos de IA
  const { models, isLoading: isLoadingModels, testConnection, fetchModels } = useAIModels();

  // Formulário para configurações do provedor
  const providerForm = useForm<ProviderForm>({
    resolver: zodResolver(providerSchema),
  });

  // Formulário para edição de prompts
  const promptForm = useForm<PromptForm>({
    resolver: zodResolver(promptSchema),
  });

  const currentApiKey = providerForm.watch('ia_api_key');
  const currentProvider = providerForm.watch('ia_provedor');

  // Preencher formulários quando os dados carregarem
  useEffect(() => {
    if (configuracao) {
      providerForm.reset({
        ia_provedor: (configuracao.ia_provedor as IAProvider) || 'openai',
        ia_api_key: configuracao.ia_api_key || '',
      });
    }
  }, [configuracao, providerForm]);

  useEffect(() => {
    if (prompts && prompts.length > 0 && !selectedAgentId) {
      setSelectedAgentId(prompts[0].id);
    }
  }, [prompts, selectedAgentId]);

  useEffect(() => {
    const selectedPrompt = prompts?.find(p => p.id === selectedAgentId);
    if (selectedPrompt) {
      promptForm.reset({
        modelo_ia: selectedPrompt.modelo_ia,
        prompt_base: selectedPrompt.prompt_base,
      });
    }
  }, [selectedAgentId, prompts, promptForm]);

  // Carregar modelos quando a API key for válida
  useEffect(() => {
    if (currentProvider && currentApiKey && currentApiKey.length > 10) {
      fetchModels(currentProvider, currentApiKey).catch(console.error);
    }
  }, [currentProvider, currentApiKey, fetchModels]);

  const onProviderSubmit = async (data: ProviderForm) => {
    const updateData: Partial<AtualizarConfiguracaoData> = {
      ia_provedor: data.ia_provedor,
      ia_api_key: data.ia_api_key,
    };
    
    atualizar(updateData, {
      onSuccess: () => setSnackbar({ open: true, message: 'Configurações do provedor salvas!', severity: 'success' }),
      onError: (e) => setSnackbar({ open: true, message: `Erro: ${e.message}`, severity: 'error' }),
    });
  };

  const onPromptSubmit = async (data: PromptForm) => {
    if (!selectedAgentId) return;
    updatePromptMutation.mutate({ id: selectedAgentId, updates: data });
  };

  const handleTestConnection = async () => {
    const success = await testConnection(currentProvider, currentApiKey || '');
    setSnackbar({
      open: true,
      message: success ? 'Conexão bem-sucedida!' : 'Falha na conexão. Verifique a chave de API.',
      severity: success ? 'success' : 'error',
    });
  };

  if (isLoadingConfig || isLoadingPrompts) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (errorConfig) {
    return <Alert severity="error">Erro ao carregar configurações: {errorConfig.message}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <BrainCircuit size={32} style={{ marginRight: theme.spacing(1) }} />
        Configurações de Inteligência Artificial
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Gerencie o provedor de IA e os prompts para cada agente do sistema.
      </Typography>

      {/* Card 1: Configurações do Provedor */}
      <Card sx={{ mb: 4 }}>
        <form onSubmit={providerForm.handleSubmit(onProviderSubmit)}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Key size={20} /> Provedor e Chave de API (Global)
            </Typography>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' } }}>
              <Controller
                name="ia_provedor"
                control={providerForm.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Provedor de IA</InputLabel>
                    <Select {...field} label="Provedor de IA">
                      <MenuItem value="openai">OpenAI (GPT)</MenuItem>
                      <MenuItem value="lambda">Anthropic (Claude)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="ia_api_key"
                control={providerForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Chave de API"
                    type="password"
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Box>
          </CardContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleTestConnection} variant="outlined" startIcon={<TestTube />} disabled={!currentApiKey}>
              Testar Conexão
            </Button>
            <Button type="submit" variant="contained" startIcon={<Save />} disabled={isUpdatingConfig}>
              {isUpdatingConfig ? 'Salvando...' : 'Salvar Provedor'}
            </Button>
          </DialogActions>
        </form>
      </Card>

      {/* Card 2: Gerenciamento de Prompts */}
      <Card>
        <form onSubmit={promptForm.handleSubmit(onPromptSubmit)}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bot size={20} /> Gerenciamento de Prompts dos Agentes
            </Typography>
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <FormControl fullWidth>
                <InputLabel>Selecione o Agente</InputLabel>
                <Select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  label="Selecione o Agente"
                >
                  {prompts?.map((p: IaPrompt) => (
                    <MenuItem key={p.id} value={p.id}>{p.nome_agente}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Controller
                name="modelo_ia"
                control={promptForm.control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth error={!!fieldState.error} disabled={isLoadingModels}>
                    <InputLabel>Modelo de IA</InputLabel>
                    <Select {...field} label="Modelo de IA">
                      {models.map((model) => (
                        <MenuItem key={model.id} value={model.id}>{model.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
            <Divider sx={{ my: 3 }} />
            <Controller
              name="prompt_base"
              control={promptForm.control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Prompt Base do Agente"
                  multiline
                  rows={15}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </CardContent>
          <DialogActions sx={{ p: 2 }}>
            <Button type="submit" variant="contained" startIcon={<Save />} disabled={updatePromptMutation.isPending || !selectedAgentId}>
              {updatePromptMutation.isPending ? 'Salvando...' : 'Salvar Prompt do Agente'}
            </Button>
          </DialogActions>
        </form>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}