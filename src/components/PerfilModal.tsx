import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tab,
  Tabs,
  Typography,
  IconButton,
  Avatar,
  Card,
  CardContent,
  TextField,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  X,
  Camera,
  User,
  Lock,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { formatarTelefone } from '../utils/validations';
import {
  usePerfil,
  useAtualizarDadosPessoais,
  useAlterarSenha,
  useUploadFotoPerfil,
} from '../hooks/usePerfil';
import type {
  EditarDadosPessoaisData,
  AlterarSenhaData,
  PerfilModalState,
} from '../types/perfil';
import {
  editarDadosPessoaisSchema,
  alterarSenhaSchema,
} from '../types/perfil';

interface PerfilModalProps {
  open: boolean;
  onClose: () => void;
}

export function PerfilModal({ open, onClose }: PerfilModalProps) {
  const { usuario } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks do React Query
  const { data: perfilData } = usePerfil();
  const atualizarDadosMutation = useAtualizarDadosPessoais();
  const alterarSenhaMutation = useAlterarSenha();
  const uploadFotoMutation = useUploadFotoPerfil();

  const [modalState, setModalState] = useState<PerfilModalState>({
    isOpen: open,
    activeTab: 'dados',
    isLoading: false,
    uploadingPhoto: false,
  });

  const [showPasswords, setShowPasswords] = useState({
    senhaAtual: false,
    novaSenha: false,
    confirmarSenha: false,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form para dados pessoais
  const dadosForm = useForm<EditarDadosPessoaisData>({
    resolver: zodResolver(editarDadosPessoaisSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
    },
  });

  // Form para alteração de senha
  const senhaForm = useForm<AlterarSenhaData>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: {
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  // Atualizar valores do formulário quando perfilData carregarem
  useEffect(() => {
    if (perfilData) {
      dadosForm.reset({
        nome: perfilData.nome || '',
        email: perfilData.email || '',
        telefone: perfilData.telefone || '',
      });
    }
  }, [perfilData, dadosForm]);

  // Limpar preview quando modal fechar
  useEffect(() => {
    if (!open) {
      setPreviewImage(null);
    }
  }, [open]);

  // Mudança de aba
  const handleTabChange = (_: React.SyntheticEvent, newValue: 'dados' | 'senha') => {
    setModalState((prev: PerfilModalState) => ({ ...prev, activeTab: newValue }));
  };

  // Upload de foto
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações do arquivo
    if (!file.type.startsWith('image/')) {
      // Erro será tratado pelo hook do upload
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // Erro será tratado pelo hook do upload
      return;
    }

    // Preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    handleUploadFoto(file);
  };

  const handleUploadFoto = async (file: File) => {
    try {
      await uploadFotoMutation.mutateAsync(file);
      // Preview da imagem será atualizado automaticamente pelo React Query
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro no upload:', error);
    }
  };

  // Submissão de dados pessoais
  const handleSubmitDados = async (data: EditarDadosPessoaisData) => {
    try {
      await atualizarDadosMutation.mutateAsync(data);
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro ao atualizar dados:', error);
    }
  };

  // Submissão de alteração de senha
  const handleSubmitSenha = async (data: AlterarSenhaData) => {
    try {
      await alterarSenhaMutation.mutateAsync(data);
      senhaForm.reset();
      
      // Fecha o modal já que o usuário será redirecionado para login
      onClose();
    } catch (error) {
      // Erro já tratado no hook
      console.error('Erro ao alterar senha:', error);
    }
  };

  // Toggle de visibilidade de senha
  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Meu Perfil
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <X size={24} />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 0, py: 0 }}>
          <Tabs
            value={modalState.activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 3,
              pt: 2,
            }}
          >
            <Tab
              label="Dados Pessoais"
              value="dados"
              icon={<User size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab
              label="Alterar Senha"
              value="senha"
              icon={<Lock size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>

          <Box sx={{ px: 3, py: 3 }}>
            {modalState.activeTab === 'dados' && (
              <Box component="form" onSubmit={dadosForm.handleSubmit(handleSubmitDados)}>
                {/* Seção de Foto de Perfil */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Foto de Perfil
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: 'primary.main',
                            fontSize: '2rem',
                            fontWeight: 600,
                          }}
                          src={previewImage || perfilData?.fotoPerfil || undefined}
                        >
                          {!previewImage && !perfilData?.fotoPerfil && (perfilData?.nome?.charAt(0).toUpperCase() || usuario?.nome?.charAt(0).toUpperCase() || 'U')}
                        </Avatar>
                        
                        {uploadFotoMutation.isPending && (
                          <CircularProgress
                            size={24}
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        )}
                      </Box>
                      
                      <Box>
                        <Button
                          variant="outlined"
                          startIcon={<Camera size={20} />}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadFotoMutation.isPending}
                          sx={{ mb: 1 }}
                        >
                          {uploadFotoMutation.isPending ? 'Enviando...' : 'Alterar Foto'}
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                          JPG, PNG ou GIF até 5MB
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* Formulário de Dados Pessoais */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Informações Pessoais
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                      <Controller
                        name="nome"
                        control={dadosForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Nome Completo"
                            fullWidth
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            disabled={atualizarDadosMutation.isPending}
                          />
                        )}
                      />
                      
                      <Controller
                        name="email"
                        control={dadosForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Email"
                            type="email"
                            fullWidth
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            disabled={atualizarDadosMutation.isPending}
                          />
                        )}
                      />
                      
                      <Controller
                        name="telefone"
                        control={dadosForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Telefone"
                            fullWidth
                            placeholder="(11) 99999-9999"
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            disabled={atualizarDadosMutation.isPending}
                            onChange={(e) => {
                              // Aplicar máscara automática
                              const valorFormatado = formatarTelefone(e.target.value);
                              field.onChange(valorFormatado);
                            }}
                          />
                        )}
                      />
                    </Box>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={atualizarDadosMutation.isPending ? <CircularProgress size={20} /> : <Save size={20} />}
                    disabled={atualizarDadosMutation.isPending}
                    sx={{ minWidth: 120 }}
                  >
                    {atualizarDadosMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </Box>
              </Box>
            )}

            {modalState.activeTab === 'senha' && (
              <Box component="form" onSubmit={senhaForm.handleSubmit(handleSubmitSenha)}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Alterar Senha
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Por segurança, você precisa informar sua senha atual para criar uma nova senha.
                    </Alert>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <Controller
                        name="senhaAtual"
                        control={senhaForm.control}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Senha Atual"
                            type={showPasswords.senhaAtual ? 'text' : 'password'}
                            fullWidth
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            disabled={alterarSenhaMutation.isPending}
                            InputProps={{
                              endAdornment: (
                                <IconButton
                                  onClick={() => togglePasswordVisibility('senhaAtual')}
                                  edge="end"
                                >
                                  {showPasswords.senhaAtual ? <EyeOff size={20} /> : <Eye size={20} />}
                                </IconButton>
                              ),
                            }}
                          />
                        )}
                      />
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                        <Controller
                          name="novaSenha"
                          control={senhaForm.control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              label="Nova Senha"
                              type={showPasswords.novaSenha ? 'text' : 'password'}
                              fullWidth
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message}
                              disabled={alterarSenhaMutation.isPending}
                              InputProps={{
                                endAdornment: (
                                  <IconButton
                                    onClick={() => togglePasswordVisibility('novaSenha')}
                                    edge="end"
                                  >
                                    {showPasswords.novaSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                                  </IconButton>
                                ),
                              }}
                            />
                          )}
                        />
                        
                        <Controller
                          name="confirmarSenha"
                          control={senhaForm.control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              label="Confirmar Nova Senha"
                              type={showPasswords.confirmarSenha ? 'text' : 'password'}
                              fullWidth
                              error={!!fieldState.error}
                              helperText={fieldState.error?.message}
                              disabled={alterarSenhaMutation.isPending}
                              InputProps={{
                                endAdornment: (
                                  <IconButton
                                    onClick={() => togglePasswordVisibility('confirmarSenha')}
                                    edge="end"
                                  >
                                    {showPasswords.confirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                                  </IconButton>
                                ),
                              }}
                            />
                          )}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={alterarSenhaMutation.isPending ? <CircularProgress size={20} /> : <Save size={20} />}
                    disabled={alterarSenhaMutation.isPending}
                    sx={{ minWidth: 120 }}
                  >
                    {alterarSenhaMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}