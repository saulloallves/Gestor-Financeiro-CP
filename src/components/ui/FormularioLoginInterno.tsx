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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { loginInternoSchema, type LoginInternoData } from '../../types/auth';
import { useAuthStore } from '../../store/authStore';

export function FormularioLoginInterno() {
  const theme = useTheme();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const { login, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInternoData>({
    resolver: zodResolver(loginInternoSchema),
  });

  const onSubmit = async (data: LoginInternoData) => {
    try {
      await login(data, 'interno');
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
        Acesso para Equipe Interna
      </Typography>

      <TextField
        {...register('email')}
        label="Email"
        type="email"
        variant="outlined"
        fullWidth
        error={!!errors.email}
        helperText={errors.email?.message}
        placeholder='seu.email@crescieperdi.com.br'
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Mail size={20} />
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
              <Lock size={20} />
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
          'Acessar Sistema'
        )}
      </Button>
    </Box>
  );
}
