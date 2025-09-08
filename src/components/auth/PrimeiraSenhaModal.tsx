import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  LinearProgress,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Eye, EyeOff, Lock, Shield, Key } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UsuariosInternosService } from '../../api/usuariosInternosService';
import { useAuthState } from '../../hooks/useAuthState';
import type { TrocarSenhaPrimeiroAcesso } from '../../types/equipes';

const schemaTrocaSenha = z.object({
  nova_senha: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial'),
  confirmar_senha: z.string()
}).refine(
  (data) => data.nova_senha === data.confirmar_senha,
  {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha']
  }
);

interface PrimeiraSenhaModalProps {
  open: boolean;
  primeiroAcesso: boolean;
  senhaTemporaria: boolean;
}

export function PrimeiraSenhaModal({ 
  open, 
  primeiroAcesso, 
  senhaTemporaria 
}: PrimeiraSenhaModalProps) {
  const theme = useTheme();
  const { userInfo, marcarPrimeiroAcessoCompleto, refetchAuthState } = useAuthState();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<TrocarSenhaPrimeiroAcesso>({
    resolver: zodResolver(schemaTrocaSenha),
    mode: 'onChange'
  });

  const novaSenha = watch('nova_senha') || '';

  const verificarForcaSenha = useCallback(() => {
    const critérios = [
      { válido: novaSenha.length >= 8, texto: 'Mínimo 8 caracteres' },
      { válido: /[A-Z]/.test(novaSenha), texto: 'Letra maiúscula' },
      { válido: /[a-z]/.test(novaSenha), texto: 'Letra minúscula' },
      { válido: /[0-9]/.test(novaSenha), texto: 'Número' },
      { válido: /[^A-Za-z0-9]/.test(novaSenha), texto: 'Caractere especial' }
    ];
    return critérios;
  }, [novaSenha]);

  const onSubmit = async (dados: TrocarSenhaPrimeiroAcesso) => {
    // Type guard para UsuarioInterno
    const usuarioInterno = userInfo && 'perfil' in userInfo ? userInfo : null;
    
    if (!usuarioInterno?.user_id) {
      toast.error('Usuário não identificado');
      return;
    }

    setCarregando(true);
    
    try {
      const resultado = await UsuariosInternosService.trocarSenhaPrimeiroAcesso(
        usuarioInterno.user_id,
        dados
      );

      if (resultado.success) {
        await marcarPrimeiroAcessoCompleto();
        
        toast.success('Senha alterada com sucesso!');
        
        setTimeout(() => {
          refetchAuthState();
        }, 1000);
      } else {
        toast.error(resultado.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao trocar senha:', error);
      toast.error('Erro inesperado ao alterar senha');
    } finally {
      setCarregando(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const getTipoMensagem = () => {
    if (primeiroAcesso) {
      return {
        título: 'Primeiro Acesso - Definir Nova Senha',
        mensagem: 'Este é seu primeiro acesso ao sistema. Por favor, defina uma nova senha segura.',
        ícone: <Shield size={24} color={theme.palette.primary.main} />
      };
    } else if (senhaTemporaria) {
      return {
        título: 'Senha Temporária - Alteração Obrigatória',
        mensagem: 'Você está usando uma senha temporária. É necessário definir uma nova senha para continuar.',
        ícone: <Key size={24} color={theme.palette.warning.main} />
      };
    } else {
      return {
        título: 'Alteração de Senha Obrigatória',
        mensagem: 'Por segurança, é necessário alterar sua senha.',
        ícone: <Lock size={24} color={theme.palette.error.main} />
      };
    }
  };

  const { título, mensagem, ícone } = getTipoMensagem();
  const critériosSenha = verificarForcaSenha();

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return false;
        }
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: theme.shadows[10]
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      {carregando && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1 
          }} 
        />
      )}
      
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper'
        }}
      >
        {ícone}
        <Typography variant="h6" component="div">
          {título}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ padding: theme.spacing(3) }}>
        <Alert 
          severity={primeiroAcesso ? "info" : senhaTemporaria ? "warning" : "error"}
          sx={{ marginBottom: 3 }}
        >
          {mensagem}
        </Alert>

        <Box component="form" noValidate autoComplete="off">
          <Controller
            name="nova_senha"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type={mostrarSenha ? 'text' : 'password'}
                label="Nova Senha"
                error={!!errors.nova_senha}
                helperText={errors.nova_senha?.message}
                disabled={carregando}
                sx={{ marginBottom: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        edge="end"
                        disabled={carregando}
                      >
                        {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Controller
            name="confirmar_senha"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                type={mostrarConfirmacao ? 'text' : 'password'}
                label="Confirmar Nova Senha"
                error={!!errors.confirmar_senha}
                helperText={errors.confirmar_senha?.message}
                disabled={carregando}
                sx={{ marginBottom: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setMostrarConfirmacao(!mostrarConfirmacao)}
                        edge="end"
                        disabled={carregando}
                      >
                        {mostrarConfirmacao ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          {novaSenha && (
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
                Critérios da senha:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {critériosSenha.map((critério, index) => (
                  <Chip
                    key={index}
                    label={critério.texto}
                    size="small"
                    color={critério.válido ? 'success' : 'default'}
                    variant={critério.válido ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ padding: theme.spacing(2, 3, 3, 3) }}>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          fullWidth
          disabled={!isValid || carregando}
          sx={{ 
            height: 48,
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          {carregando ? 'Alterando Senha...' : 'Confirmar Nova Senha'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
