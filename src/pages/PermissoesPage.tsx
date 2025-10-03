import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { usePermissoes, useCreatePermissao, useUpdatePermissao, useDeletePermissao } from '../hooks/usePermissoes';
import { PermissaoForm } from '../components/PermissaoForm';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import type { Permissao, PermissaoFormData } from '../types/permissoes';

export function PermissoesPage() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPermissao, setSelectedPermissao] = useState<Permissao | null>(null);

  const { data: permissoes, isLoading } = usePermissoes();
  const createMutation = useCreatePermissao();
  const updateMutation = useUpdatePermissao();
  const deleteMutation = useDeletePermissao();

  const handleOpenForm = (permissao?: Permissao) => {
    setSelectedPermissao(permissao || null);
    setFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setFormModalOpen(false);
    setSelectedPermissao(null);
  };

  const handleOpenConfirm = (permissao: Permissao) => {
    setSelectedPermissao(permissao);
    setConfirmModalOpen(true);
  };

  const handleCloseConfirm = () => {
    setConfirmModalOpen(false);
    setSelectedPermissao(null);
  };

  const handleFormSubmit = async (data: PermissaoFormData) => {
    if (selectedPermissao) {
      await updateMutation.mutateAsync({ id: selectedPermissao.id, dados: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    handleCloseForm();
  };

  const handleDelete = async () => {
    if (selectedPermissao) {
      await deleteMutation.mutateAsync(selectedPermissao.id);
    }
    handleCloseConfirm();
  };

  const columns: GridColDef[] = [
    { field: 'recurso', headerName: 'Recurso', flex: 1 },
    {
      field: 'perfil',
      headerName: 'Perfil',
      width: 150,
      valueGetter: (_value: unknown, row: Permissao) => row.perfil,
      renderCell: (params) => params.value ? <Chip label={params.value} size="small" /> : 'N/A',
    },
    {
      field: 'equipe',
      headerName: 'Equipe',
      width: 200,
      valueGetter: (_value: unknown, row: Permissao) => row.equipes?.nome_equipe,
      renderCell: (params) => params.value ? <Chip label={params.value} size="small" variant="outlined" /> : 'N/A',
    },
    {
      field: 'permitido',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value ? 'Permitido' : 'Negado'}>
          {params.value ? <CheckCircle color="green" /> : <XCircle color="red" />}
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit size={16} />}
          label="Editar"
          onClick={() => handleOpenForm(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Trash2 size={16} />}
          label="Excluir"
          onClick={() => handleOpenConfirm(params.row)}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">Gerenciamento de Permissões</Typography>
        <Button variant="contained" startIcon={<PlusCircle />} onClick={() => handleOpenForm()}>
          Nova Permissão
        </Button>
      </Box>
      <Paper sx={{ height: '70vh', width: '100%' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={permissoes || []}
            columns={columns}
            disableRowSelectionOnClick
          />
        )}
      </Paper>
      <PermissaoForm
        open={formModalOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        permissao={selectedPermissao}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
      <ConfirmationDialog
        open={confirmModalOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a permissão para o recurso "${selectedPermissao?.recurso}"?`}
        confirmText="Excluir"
      />
    </Box>
  );
}