import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Stack,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@mui/material/styles";
import {
  usuarioInternoSchema,
  type UsuarioInternoFormData,
  type UsuarioInterno,
} from "../types/equipes";
import {
  useCreateUsuarioInterno,
  useUpdateUsuarioInterno,
} from "../hooks/useUsuariosInternos";
import { useEquipesAtivas } from "../hooks/useEquipes";
import { formatarTelefone } from "../utils/validations";

// ==============================================
// INTERFACES
// ==============================================

interface UsuarioInternoFormProps {
  open: boolean;
  onClose: () => void;
  usuario?: UsuarioInterno;
}

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

export function UsuarioInternoForm({ open, onClose, usuario }: UsuarioInternoFormProps) {
  const theme = useTheme();
  const createUsuarioMutation = useCreateUsuarioInterno();
  const updateUsuarioMutation = useUpdateUsuarioInterno();
  const { data: equipesAtivas, isLoading: loadingEquipes } = useEquipesAtivas();

  const isEditing = !!usuario;
  const isLoading = createUsuarioMutation.isPending || updateUsuarioMutation.isPending;

  // Setup do formulário
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<UsuarioInternoFormData>({
    resolver: zodResolver(usuarioInternoSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      perfil: "operador",
      equipe_id: "",
      status: "ativo",
    },
    mode: "onChange",
  });

  // Resetar formulário quando abrir/fechar ou usuário mudar
  React.useEffect(() => {
    if (open) {
      reset(
        usuario
          ? {
              nome: usuario.nome,
              email: usuario.email,
              telefone: usuario.telefone || "",
              perfil: usuario.perfil,
              equipe_id: usuario.equipe_id || "",
              status: usuario.status,
            }
          : {
              nome: "",
              email: "",
              telefone: "",
              perfil: "operador",
              equipe_id: "",
              status: "ativo",
            }
      );
    }
  }, [open, usuario, reset]);

  // Handler para submit
  const onSubmit = async (data: UsuarioInternoFormData) => {
    if (isEditing) {
      await updateUsuarioMutation.mutateAsync({
        id: usuario.id,
        updates: data,
      });
    } else {
      await createUsuarioMutation.mutateAsync(data);
    }
    
    handleClose();
  };

  // Handler para fechar
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "primary.main",
          color: "primary.contrastText",
          fontWeight: 600,
        }}
      >
        {isEditing ? "Editar Usuário" : "Novo Usuário"}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ padding: theme.spacing(3) }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            
            {/* Seção: Dados Pessoais */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                Dados Pessoais
              </Typography>

              <Stack spacing={2}>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome Completo"
                      placeholder="Digite o nome completo"
                      fullWidth
                      required
                      error={!!errors.nome}
                      helperText={errors.nome?.message}
                      InputProps={{
                        sx: { borderRadius: 1 },
                      }}
                    />
                  )}
                />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="E-mail Corporativo"
                        placeholder="usuario@empresa.com"
                        type="email"
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        InputProps={{
                          sx: { borderRadius: 1 },
                        }}
                      />
                    )}
                  />

                  <Controller
                    name="telefone"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Telefone"
                        placeholder="(11) 99999-9999"
                        fullWidth
                        error={!!errors.telefone}
                        helperText={errors.telefone?.message}
                        onChange={(e) => {
                          const telefoneFormatado = formatarTelefone(
                            e.target.value
                          );
                          field.onChange(telefoneFormatado);
                        }}
                        InputProps={{
                          sx: { borderRadius: 1 },
                        }}
                      />
                    )}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Seção: Equipe e Acesso */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                Equipe e Acesso
              </Typography>

              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Controller
                    name="equipe_id"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth required>
                        <InputLabel>Equipe</InputLabel>
                        <Select
                          {...field}
                          label="Equipe"
                          error={!!errors.equipe_id}
                          disabled={loadingEquipes}
                          sx={{ borderRadius: 1 }}
                        >
                          {equipesAtivas?.map((equipe) => (
                            <MenuItem key={equipe.id} value={equipe.id}>
                              {equipe.nome_equipe}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.equipe_id && (
                          <Typography color="error" variant="caption">
                            {errors.equipe_id.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="perfil"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth required>
                        <InputLabel>Perfil de Acesso</InputLabel>
                        <Select
                          {...field}
                          label="Perfil de Acesso"
                          error={!!errors.perfil}
                          sx={{ borderRadius: 1 }}
                        >
                          <MenuItem value="operador">Operador</MenuItem>
                          <MenuItem value="gestor">Gestor</MenuItem>
                          <MenuItem value="juridico">Jurídico</MenuItem>
                          <MenuItem value="admin">Administrador</MenuItem>
                        </Select>
                        {errors.perfil && (
                          <Typography color="error" variant="caption">
                            {errors.perfil.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth required>
                        <InputLabel>Status</InputLabel>
                        <Select
                          {...field}
                          label="Status"
                          error={!!errors.status}
                          sx={{ borderRadius: 1 }}
                        >
                          <MenuItem value="ativo">Ativo</MenuItem>
                          <MenuItem value="inativo">Inativo</MenuItem>
                        </Select>
                        {errors.status && (
                          <Typography color="error" variant="caption">
                            {errors.status.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                  <Box sx={{ flexGrow: 1 }} />
                </Stack>
              </Stack>
            </Box>

            {/* Informação sobre senha (apenas para criação) */}
            {!isEditing && (
              <Box
                sx={{
                  backgroundColor: "info.lighter",
                  padding: 2,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "info.light",
                }}
              >
                <Typography variant="body2" color="info.main">
                  <strong>Importante:</strong> Uma senha temporária será gerada automaticamente
                  e enviada para o e-mail do usuário. O usuário deverá alterá-la no primeiro acesso.
                </Typography>
              </Box>
            )}

          </Box>
        </DialogContent>

        <DialogActions sx={{ padding: theme.spacing(2, 3, 3) }}>
          <Button
            onClick={handleClose}
            disabled={isLoading}
            sx={{
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "grey.100",
              },
            }}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={!isValid || isLoading || loadingEquipes}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : null
            }
            sx={{
              minWidth: 120,
              borderRadius: 1,
            }}
          >
            {isLoading
              ? "Salvando..."
              : isEditing
              ? "Atualizar"
              : "Criar Usuário"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
