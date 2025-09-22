import { useState, useEffect } from 'react';
import {
  Box,
  Card,
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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  RefreshCw, 
  Save, 
  BrainCircuit,
  TestTube,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { useAIModels } from '../hooks/useAIModels';
import type { AtualizarConfiguracaoData } from '../types/configuracoes';
import type { IAProvider } from '../types/ia';

// Schema para configurações de IA
const configIASchema = z.object({
  ia_provedor: z.enum(['openai', 'lambda'] as const),
  ia_modelo: z.string().min(1, "Modelo é obrigatório"),
  ia_api_key: z.string().min(1, "Chave de API é obrigatória"),
});

type ConfigIAForm = z.infer<typeof configIASchema>;

export function ConfiguracoesIAPage() {
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const { configuracao, isLoading, error, atualizar, isUpdating } = useConfiguracoes();

  const iaForm = useForm<ConfigIAForm>({
    resolver: zodResolver(configIASchema),
    defaultValues: {
      ia_provedor: 'openai',
      ia_modelo: '',
      ia_api_key: '',
    },
  });

  // Hook para modelos de IA
  const currentProvider = iaForm.watch('ia_provedor');
  const currentApiKey = iaForm.watch('ia_api_key');
  const { models, isLoading: isLoadingModels, testConnection, fetchModels } = useAIModels();

  // Preencher formulário quando os dados carregarem
  useEffect(() => {
    if (configuracao) {
      iaForm.reset({
        ia_provedor: (configuracao.ia_provedor as IAProvider) || 'openai',
        ia_modelo: configuracao.ia_modelo || '',
        ia_api_key: configuracao.ia_api_key || '',
      });
    }
  }, [configuracao, iaForm]);

  // Carregar modelos automaticamente quando houver provedor e API key salvos
  useEffect(() => {
    if (configuracao?.ia_provedor && configuracao?.ia_api_key) {
      fetchModels(configuracao.ia_provedor as IAProvider, configuracao.ia_api_key)
        .catch((error) => {
          console.log('Erro ao carregar modelos automaticamente:', error);
          // Não mostrar erro para o usuário aqui, apenas log
        });
    }
  }, [configuracao?.ia_provedor, configuracao?.ia_api_key, fetchModels]);

  // Recarregar modelos quando o provedor ou API key mudarem no formulário
  useEffect(() => {
    if (currentProvider && currentApiKey && currentApiKey.length > 10) {
      const debounceTimer = setTimeout(() => {
        fetchModels(currentProvider, currentApiKey)
          .catch((error) => {
            console.log('Erro ao recarregar modelos:', error);
          });
      }, 1000); // Debounce de 1 segundo

      return () => clearTimeout(debounceTimer);
    }
  }, [currentProvider, currentApiKey, fetchModels]);

  const salvarConfiguracoes = async (data: Partial<AtualizarConfiguracaoData>) => {
    try {
      await new Promise((resolve) => {
        atualizar(data, {
          onSuccess: () => {
            setSnackbar({
              open: true,
              message: 'Configurações de IA salvas com sucesso!',
              severity: 'success'
            });
            resolve(true);
          },
          onError: (error) => {
            setSnackbar({
              open: true,
              message: `Erro ao salvar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              severity: 'error'
            });
            resolve(false);
          }
        });
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erro ao salvar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'error'
      });
    }
  };

  const onSubmitIA = async (data: ConfigIAForm) => {
    await salvarConfiguracoes(data);
  };

  const handleTestConnection = async () => {
    try {
      await testConnection(currentProvider, currentApiKey);
      setSnackbar({
        open: true,
        message: 'Conexão testada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erro na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'error'
      });
    }
  };

  const handleFetchModels = async () => {
    try {
      await fetchModels(currentProvider, currentApiKey);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Erro ao buscar modelos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        severity: 'error'
      });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar configurações: {error?.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'text.primary' }}>
        <BrainCircuit size={32} style={{ marginRight: theme.spacing(1) }} />
        Configurações de Inteligência Artificial
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure o provedor de IA, modelo e chaves de API para o agente inteligente do sistema.
      </Typography>

      <Card sx={{ mt: 2 }}>
        <Box sx={{ p: 3 }}>
          <form onSubmit={iaForm.handleSubmit(onSubmitIA)}>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', mb: 3 }}>
              Configurações do Provedor de IA
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: '1fr' }}>
              <Controller
                name="ia_provedor"
                control={iaForm.control}
                render={({ field, fieldState }) => (
                  <FormControl error={!!fieldState.error}>
                    <InputLabel>Provedor de IA</InputLabel>
                    <Select {...field} label="Provedor de IA">
                      <MenuItem value="openai">OpenAI (GPT)</MenuItem>
                      <MenuItem value="lambda">Anthropic Claude</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="ia_api_key"
                control={iaForm.control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Chave de API"
                    type="password"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || "Insira sua chave de API do provedor selecionado"}
                    placeholder="Insira sua chave de API"
                  />
                )}
              />

              <Controller
                name="ia_modelo"
                control={iaForm.control}
                render={({ field, fieldState }) => {
                  // Criar lista de modelos que inclui o modelo salvo se não estiver na lista da API
                  const currentModelValue = field.value;
                  const modelExists = models.some(model => model.id === currentModelValue);
                  const displayModels = [...models];
                  
                  // Se existe um modelo salvo mas não está na lista, adicionar como opção
                  if (currentModelValue && !modelExists) {
                    displayModels.unshift({
                      id: currentModelValue,
                      name: `${currentModelValue} (salvo)`
                    });
                  }

                  return (
                    <FormControl error={!!fieldState.error} disabled={isLoadingModels}>
                      <InputLabel>Modelo de IA</InputLabel>
                      <Select 
                        {...field} 
                        label="Modelo de IA"
                        startAdornment={isLoadingModels && <CircularProgress size={20} />}
                      >
                        {displayModels.length === 0 && !isLoadingModels ? (
                          <MenuItem disabled>
                            Nenhum modelo disponível
                          </MenuItem>
                        ) : (
                          displayModels.map((model) => (
                            <MenuItem key={model.id} value={model.id}>
                              {model.name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {fieldState.error && (
                        <Typography variant="caption" color="error" sx={{ ml: 1.5, mt: 0.5 }}>
                          {fieldState.error.message}
                        </Typography>
                      )}
                      {!isLoadingModels && models.length === 0 && currentApiKey && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5, mt: 0.5 }}>
                          Clique em "Recarregar Modelos" para buscar modelos disponíveis
                        </Typography>
                      )}
                    </FormControl>
                  );
                }}
              />
            </Box>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={isUpdating}
              >
                {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              
              <Button
                onClick={handleTestConnection}
                variant="outlined"
                startIcon={<TestTube />}
                disabled={!currentApiKey || isLoadingModels}
              >
                Testar Conexão
              </Button>

              <Button
                onClick={handleFetchModels}
                variant="outlined"
                startIcon={<RefreshCw />}
                disabled={!currentApiKey || isLoadingModels}
              >
                {isLoadingModels ? 'Carregando...' : 'Recarregar Modelos'}
              </Button>
            </Box>
          </form>
        </Box>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}