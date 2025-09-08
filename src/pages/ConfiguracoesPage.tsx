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
  Chip
} from '@mui/material';
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
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    configuracao,
    isLoading,
    error,
    refetch,
    atualizar,
    isUpdating,
    updateError,
  } = useConfiguracoes();

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
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Configurações de Cobrança
        </Typography>
        <Button variant="outlined" onClick={() => refetch()} disabled={isLoading}>
          Recarregar
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Configurações Principais */}
        <Box sx={{ flex: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configurações de Cálculo
              </Typography>
              
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                        />
                      )}
                    />
                  </Box>

                  {/* ASAAS */}
                  <Divider />
                  <Typography variant="h6">Configurações ASAAS</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Controller
                      name="asaas_environment"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Ambiente ASAAS</InputLabel>
                          <Select {...field} label="Ambiente ASAAS">
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
                    >
                      {isUpdating ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Status */}
        <Box sx={{ flex: 1 }}>
          {configuracao && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Atual
                </Typography>
                <Box sx={{ fontSize: '0.875rem' }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <span>Ambiente:</span>
                    <Chip 
                      size="small" 
                      label={configuracao.asaas_environment}
                      color={configuracao.asaas_environment === 'production' ? 'error' : 'warning'}
                    />
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <span>Taxa Diária:</span>
                    <span>{(configuracao.taxa_juros_diaria * 100).toFixed(3)}%</span>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <span>Multa:</span>
                    <span>{configuracao.valor_multa_atraso}%</span>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      <Snackbar open={showSuccess} autoHideDuration={6000} onClose={() => setShowSuccess(false)}>
        <Alert onClose={() => setShowSuccess(false)} severity="success">
          Configurações salvas com sucesso!
        </Alert>
      </Snackbar>

      {updateError && (
        <Snackbar open={!!updateError} autoHideDuration={6000}>
          <Alert severity="error">
            Erro: {updateError.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
