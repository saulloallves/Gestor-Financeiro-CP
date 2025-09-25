import { useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress, Chip } from '@mui/material';
import { PlusCircle, Edit, TestTube } from 'lucide-react';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useTemplates } from '../hooks/useTemplates';
import { TemplateForm } from '../components/TemplateForm';
import { TestTemplateModal } from '../components/TestTemplateModal';
import type { Template, TemplateFormData } from '../types/comunicacao';

export function TemplatesPage() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { templates, isLoading, createTemplate, updateTemplate, isCreating, isUpdating } = useTemplates();

  const handleOpenFormModal = (template?: Template) => {
    setSelectedTemplate(template || null);
    setFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setFormModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleOpenTestModal = (template: Template) => {
    setSelectedTemplate(template);
    setTestModalOpen(true);
  };

  const handleCloseTestModal = () => {
    setTestModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleFormSubmit = async (data: TemplateFormData) => {
    if (selectedTemplate) {
      await updateTemplate({ id: selectedTemplate.id, data });
    } else {
      await createTemplate(data);
    }
    handleCloseFormModal();
  };

  const columns: GridColDef[] = [
    { field: 'nome', headerName: 'Nome', flex: 1 },
    { field: 'canal', headerName: 'Canal', width: 150, renderCell: (params) => <Chip label={params.value} size="small" /> },
    { field: 'ativo', headerName: 'Status', width: 120, renderCell: (params) => <Chip label={params.value ? 'Ativo' : 'Inativo'} color={params.value ? 'success' : 'default'} size="small" /> },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit size={16} />}
          label="Editar"
          onClick={() => handleOpenFormModal(params.row)}
        />,
        <GridActionsCellItem
          key="test"
          icon={<TestTube size={16} />}
          label="Testar"
          onClick={() => handleOpenTestModal(params.row)}
          disabled={params.row.canal !== 'whatsapp'}
        />,
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">Gerenciador de Templates</Typography>
        <Button variant="contained" startIcon={<PlusCircle />} onClick={() => handleOpenFormModal()}>
          Novo Template
        </Button>
      </Box>
      <Paper sx={{ height: '70vh', width: '100%' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={templates || []}
            columns={columns}
            disableRowSelectionOnClick
          />
        )}
      </Paper>
      <TemplateForm
        open={formModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        template={selectedTemplate}
        isLoading={isCreating || isUpdating}
      />
      <TestTemplateModal
        open={testModalOpen}
        onClose={handleCloseTestModal}
        template={selectedTemplate}
      />
    </Box>
  );
}