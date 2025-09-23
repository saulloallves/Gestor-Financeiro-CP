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
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "@mui/material/styles";
import { equipeSchema, type EquipeFormData, type Equipe } from "../types/equipes";
import { useCreateEquipe, useUpdateEquipe } from "../hooks/useEquipes";

// ==============================================
// INTERFACES
// ==============================================

interface EquipeFormProps {
  open: boolean;
  onClose: () => void;
  equipe?: Equipe;
}

// ==============================================
// COMPONENTE PRINCIPAL
// ==============================================

export function EquipeForm({ open, onClose, equipe }: EquipeFormProps) {
  const theme = useTheme();
  const createEquipeMutation = useCreateEquipe();
  const updateEquipeMutation = useUpdateEquipe();

  const isEditing = !!equipe;
  const isLoading = createEquipeMutation.isPending || updateEquipeMutation.isPending;

  // Setup do formulário
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<EquipeFormData>({
    resolver: zodResolver(equipeSchema),
    defaultValues: {
      nome_equipe: "",
      descricao: "",
      status: "ativa",
    },
    mode: "onChange",
  });

  // Resetar formulário quando abrir/fechar ou equipe mudar
  React.useEffect(() => {
    if (open) {
      reset(
        equipe
          ? {
              nome_equipe: equipe.nome_equipe,
              descricao: equipe.descricao || "",
              status: equipe.status,
            }
          : {
              nome_equipe: "",
              descricao: "",
              status: "ativa",
            }
      );
    }
  }, [open, equipe, reset]);

  // Handler para submit
  const onSubmit = async (data: EquipeFormData) => {
    if (isEditing) {
      await updateEquipeMutation.mutateAsync({
        id: equipe.id,
        updates: data,
      });
    } else {
      await createEquipeMutation.mutateAsync(data);
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
      maxWidth="sm"
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
        {isEditing ? "Editar Equipe" : "Nova Equipe"}
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ padding: theme.spacing(3) }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            
            <Controller
              name="nome_equipe"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nome da Equipe"
                  placeholder="Ex: Cobrança, Jurídico, Financeiro"
                  fullWidth
                  required
                  error={!!errors.nome_equipe}
                  helperText={errors.nome_equipe?.message}
                  InputProps={{
                    sx: { borderRadius: 1 },
                  }}
                />
              )}
            />

            <Controller
              name="descricao"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descrição"
                  placeholder="Descrição das responsabilidades da equipe"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.descricao}
                  helperText={errors.descricao?.message}
                  InputProps={{
                    sx: { borderRadius: 1 },
                  }}
                />
              )}
            />

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
                    <MenuItem value="ativa">Ativa</MenuItem>
                    <MenuItem value="inativa">Inativa</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

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
            disabled={!isValid || isLoading}
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
              : "Criar Equipe"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
