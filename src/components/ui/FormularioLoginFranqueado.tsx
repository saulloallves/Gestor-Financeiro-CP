import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { loginFranqueadoSchema, type LoginFranqueadoData } from '../../types/auth';
import { useAuthStore } from '../../store/authStore';

export function FormularioLoginFranqueado() {
  const theme = useTheme();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { login, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFranqueadoData>({
    resolver: zodResolver(loginFranqueadoSchema),
  });

  const onSubmit = async (data: LoginFranqueadoData) => {
    try {
      await login(data, 'franqueado');
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3),
        width: '100%',
      }}
    >
      <Typography
        variant="h6"
        component="h2"
        sx={{
          color: 'text.primary',
          textAlign: 'center',
          marginBottom: theme.spacing(1),
        }}
      >
        Acesso para Franqueados
      </Typography>

      <TextField
        {...register('email')}
        label="Email do Franqueado"
        variant="outlined"
        type="email"
        fullWidth
        error={!!errors.email}
        helperText={errors.email?.message}
        disabled={isLoading}
        placeholder="seu.email@exemplo.com"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Mail size={20} color={theme.palette.action.active} />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />

      <TextField
        {...register('senha')}
        label="Senha"
        type={mostrarSenha ? 'text' : 'password'}
        variant="outlined"
        fullWidth
        error={!!errors.senha}
        helperText={errors.senha?.message}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock size={20} color={theme.palette.action.active} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={toggleMostrarSenha}
                edge="end"
                disabled={isLoading}
                aria-label="alternar visibilidade da senha"
              >
                {mostrarSenha ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: 'primary.main',
            },
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={isLoading}
        sx={{
          height: 48,
          fontSize: '1.1rem',
          fontWeight: 600,
          marginTop: theme.spacing(1),
        }}
      >
        {isLoading ? (
          <CircularProgress size={24} sx={{ color: 'primary.contrastText' }} />
        ) : (
          'Acessar Portal'
        )}
      </Button>
    </Box>
  );
}
