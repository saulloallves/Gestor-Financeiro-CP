import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Settings, 
  RefreshCw, 
  Save, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Wrench,
  Cog,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import type { AtualizarConfiguracaoData } from '../types/configuracoes';

const configSchema = z.object({
  taxa_juros_diaria: z.number().min(0).max(1),
  valor_multa_atraso: z.number().min(0).max(100),
  dias_graca: z.number().min(0).max(30),
  maximo_juros_acumulado: z.number().min(0).max(1000),
  desconto_antecipado: z.number().min(0).max(100).nullable(),
  dias_desconto: z.number().min(0).max(30).nullable(),
  asaas_webhook_url: z.string().nullable(),
  asaas_environment: z.enum(['sandbox', 'production']),
  dias_lembrete_previo: z.number().min(0).max(30).nullable(),
  dias_escalonamento_juridico: z.number().min(0).max(365).nullable(),
});

type ConfigForm = z.infer<typeof configSchema>;

export default function ConfiguracoesPage() {
  const theme = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const {
    configuracao,
    isLoading,
    error,
    refetch,
    atualizar,
    isUpdating,
    updateError,
  } = useConfiguracoes();

  // Hook de debug para formatar CNPJs
  // Mock para debugging de CNPJs (funcionalidade não implementada)
  const debugFormatarCnpjs = { mutate: () => {}, isPending: false };

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      taxa_juros_diaria: 0.0033,
      valor_multa_atraso: 10,
      dias_graca: 0,
      maximo_juros_acumulado: 100,
      desconto_antecipado: 5,
      dias_desconto: 5,
      asaas_webhook_url: '',
      asaas_environment: 'sandbox',
      dias_lembrete_previo: 3,
      dias_escalonamento_juridico: 30,
    }
  });

  React.useEffect(() => {
    if (configuracao) {
      reset({
        taxa_juros_diaria: configuracao.taxa_juros_diaria,
        valor_multa_atraso: configuracao.valor_multa_atraso,
        dias_graca: configuracao.dias_graca,
        maximo_juros_acumulado: configuracao.maximo_juros_acumulado,
        desconto_antecipado: configuracao.desconto_antecipado,
        dias_desconto: configuracao.dias_desconto,
        asaas_webhook_url: configuracao.asaas_webhook_url,
        asaas_environment: configuracao.asaas_environment,
        dias_lembrete_previo: configuracao.dias_lembrete_previo,
        dias_escalonamento_juridico: configuracao.dias_escalonamento_juridico,
      });
    }
  }, [configuracao, reset]);

  const onSubmit = (data: ConfigForm) => {
    const updateData: AtualizarConfiguracaoData = {
      ...data,
      desconto_antecipado: data.desconto_antecipado || null,
      dias_desconto: data.dias_desconto || null,
      asaas_webhook_url: data.asaas_webhook_url || null,
      dias_lembrete_previo: data.dias_lembrete_previo || null,
      dias_escalonamento_juridico: data.dias_escalonamento_juridico || null,
    };

    atualizar(updateData, {
      onSuccess: () => {
        setShowSuccess(true);
      }
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando configurações...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Erro ao carregar configurações: {error.message}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        padding: theme.spacing(3),
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2, md: 0 },
          marginBottom: theme.spacing(3),
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Configurações Gerais
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Gerencie configurações do sistema e parâmetros de cobrança
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshCw size={20} />}
          onClick={() => refetch()}
          disabled={isLoading}
          sx={{ minWidth: 140 }}
        >
          Recarregar
        </Button>
      </Box>

      {/* Abas de Configurações */}
      <Box sx={{ marginBottom: theme.spacing(3) }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
          }}
        >
          <Tab
            icon={<Cog size={20} />}
            iconPosition="start"
            label="Configurações Gerais"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              minHeight: 64,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            }}
          />
          <Tab
            icon={<DollarSign size={20} />}
            iconPosition="start"
            label="Configurações de Cobrança"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              minHeight: 64,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            }}
          />
        </Tabs>
      </Box>

      {/* Conteúdo das Abas */}
      {activeTab === 0 && (
        <Box>
          {/* Card de Ferramentas de Debug */}
          <Card
            sx={{
              borderRadius: 3,
              backgroundColor: "background.paper",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: "6px solid",
              borderLeftColor: "warning.main",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Cabeçalho da seção */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "warning.main",
                    borderRadius: 3,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wrench size={24} color="white" />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      mb: 0.5,
                    }}
                  >
                    Ferramentas de Debug
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Ferramentas para manutenção e correção de dados
                  </Typography>
                </Box>
              </Box>

              {/* Área de Debug */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>⚠️ Atenção:</strong> As ferramentas abaixo são destinadas apenas para correção pontual de dados. 
                  Use com cautela e apenas quando necessário.
                </Alert>

                <Box sx={{ p: 3, border: 1, borderColor: 'warning.main', borderRadius: 2, backgroundColor: 'rgba(255, 167, 38, 0.05)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'warning.dark' }}>
                    Formatação de CNPJs
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    Esta ferramenta irá formatar todos os CNPJs das unidades no banco de dados, 
                    aplicando a máscara padrão (XX.XXX.XXX/XXXX-XX). Útil para corrigir dados importados sem formatação.
                  </Typography>
                  
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<Wrench size={20} />}
                    onClick={() => {
                      if (window.confirm(
                        "⚠️ ATENÇÃO: Esta operação irá formatar TODOS os CNPJs das unidades no banco de dados.\n\n" +
                        "Esta ação deve ser executada apenas UMA VEZ para corrigir dados importados.\n\n" +
                        "Você tem certeza que deseja continuar?"
                      )) {
                        debugFormatarCnpjs.mutate();
                      }
                    }}
                    disabled={debugFormatarCnpjs.isPending}
                    sx={{ 
                      minWidth: 200,
                      fontWeight: 500,
                      textTransform: 'none',
                    }}
                  >
                    {debugFormatarCnpjs.isPending ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Formatando...
                      </>
                    ) : (
                      "Formatar Todos os CNPJs"
                    )}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Aba de Configurações de Cobrança */}
      {activeTab === 1 && (
        <>
          {/* Cards de Informações Rápidas - Aba Cobrança */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 3,
          marginBottom: theme.spacing(3),
        }}
      >
        {/* Ambiente Atual */}
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid",
            borderColor: "divider",
            borderLeft: `6px solid ${configuracao?.asaas_environment === 'production' ? '#f44336' : '#ffa726'}`,
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: configuracao?.asaas_environment === 'production' 
                ? "0 8px 25px rgba(244, 67, 54, 0.15)" 
                : "0 8px 25px rgba(255, 167, 38, 0.15)",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {configuracao?.asaas_environment === 'production' ? 'PRODUÇÃO' : 'SANDBOX'}
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Ambiente ASAAS
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: configuracao?.asaas_environment === 'production' 
                  ? "rgba(244, 67, 54, 0.1)" 
                  : "rgba(255, 167, 38, 0.1)",
                borderRadius: 3,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {configuracao?.asaas_environment === 'production' ? (
                <AlertTriangle size={32} color="#f44336" />
              ) : (
                <Settings size={32} color="#ffa726" />
              )}
            </Box>
          </Box>
        </Card>

        {/* Taxa de Juros */}
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid",
            borderColor: "divider",
            borderLeft: "6px solid #667eea",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 25px rgba(102, 126, 234, 0.15)",
              borderLeftColor: "#5a67d8",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {configuracao ? (configuracao.taxa_juros_diaria * 100).toFixed(3) : '0.000'}%
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Taxa Juros Diária
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: "rgba(102, 126, 234, 0.1)",
                borderRadius: 3,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={32} color="#667eea" />
            </Box>
          </Box>
        </Card>

        {/* Multa por Atraso */}
        <Card
          sx={{
            p: 3,
            borderRadius: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            border: "1px solid",
            borderColor: "divider",
            borderLeft: "6px solid #11998e",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 25px rgba(17, 153, 142, 0.15)",
              borderLeftColor: "#0d7377",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}
              >
                {configuracao?.valor_multa_atraso || 0}%
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 500 }}
              >
                Multa por Atraso
              </Typography>
            </Box>
            <Box
              sx={{
                backgroundColor: "rgba(17, 153, 142, 0.1)",
                borderRadius: 3,
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DollarSign size={32} color="#11998e" />
            </Box>
          </Box>
        </Card>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Configurações Principais */}
        <Box sx={{ flex: 2 }}>
          <Card
            sx={{
              borderRadius: 3,
              backgroundColor: "background.paper",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
              border: "1px solid",
              borderColor: "divider",
              borderLeft: "6px solid",
              borderLeftColor: "primary.main",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Cabeçalho da seção */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: "primary.main",
                    borderRadius: 3,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Settings size={24} color="white" />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      mb: 0.5,
                    }}
                  >
                    Configurações de Cálculo
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Defina parâmetros para cálculo de juros e multas
                  </Typography>
                </Box>
              </Box>
              
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Taxa e Multa */}
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Controller
                      name="taxa_juros_diaria"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Taxa de Juros Diária"
                          type="number"
                          fullWidth
                          inputProps={{ step: "0.0001", min: "0", max: "1" }}
                          error={!!errors.taxa_juros_diaria}
                          helperText="Ex: 0.0033 para 0.33% ao dia"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                        />
                      )}
                    />
                    <Controller
                      name="valor_multa_atraso"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Multa por Atraso (%)"
                          type="number"
                          fullWidth
                          inputProps={{ step: "0.01", min: "0", max: "100" }}
                          error={!!errors.valor_multa_atraso}
                          helperText="Percentual da multa"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            },
                          }}
                        />
                      )}
                    />
                  </Box>

                  {/* ASAAS */}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                    Configurações ASAAS
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Controller
                      name="asaas_environment"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Ambiente ASAAS</InputLabel>
                          <Select 
                            {...field} 
                            label="Ambiente ASAAS"
                            sx={{
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderRadius: 2,
                              },
                            }}
                          >
                            <MenuItem value="sandbox">Sandbox (Teste)</MenuItem>
                            <MenuItem value="production">Produção</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Box>

                  <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isUpdating}
                      startIcon={<Save size={20} />}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontWeight: 500,
                        textTransform: "none",
                        minWidth: 140,
                      }}
                    >
                      {isUpdating ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Status Detalhado */}
        <Box sx={{ flex: 1 }}>
          {configuracao && (
            <Card
              sx={{
                borderRadius: 3,
                backgroundColor: "background.paper",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                border: "1px solid",
                borderColor: "divider",
                borderLeft: "6px solid #11998e",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Cabeçalho da seção de status */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: "#11998e",
                      borderRadius: 3,
                      p: 1.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CheckCircle size={24} color="white" />
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        mb: 0.5,
                      }}
                    >
                      Status Atual
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Configurações ativas
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ fontSize: '0.875rem' }}>
                  <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                    <Typography variant="body2" color="text.secondary">Ambiente:</Typography>
                    <Chip 
                      size="small" 
                      label={configuracao.asaas_environment}
                      color={configuracao.asaas_environment === 'production' ? 'error' : 'warning'}
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">Taxa Diária:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {(configuracao.taxa_juros_diaria * 100).toFixed(3)}%
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">Multa:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {configuracao.valor_multa_atraso}%
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Typography variant="body2" color="text.secondary">Dias de Graça:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {configuracao.dias_graca || 0} dias
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Máx. Juros:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {configuracao.maximo_juros_acumulado}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

        {updateError && (
          <Snackbar open={!!updateError} autoHideDuration={6000}>
            <Alert severity="error">
              Erro: {updateError.message}
            </Alert>
          </Snackbar>
        )}
        </>
      )}

      <Snackbar open={showSuccess} autoHideDuration={6000} onClose={() => setShowSuccess(false)}>
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Configurações salvas com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
}
