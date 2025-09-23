import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useBaseConhecimento } from '../hooks/useBaseConhecimento';
import { ConhecimentoForm } from '../components/ConhecimentoForm';
import type { CriarBaseConhecimento, BaseConhecimento } from '../types/ia';
import toast from 'react-hot-toast';

const BaseConhecimentoPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<BaseConhecimento | null>(null);
  const { 
    conhecimentos, 
    isLoading, 
    criarConhecimento, 
    atualizarConhecimento,
    deletarConhecimento
  } = useBaseConhecimento();

  const handleOpenModal = () => {
    setSelectedKnowledge(null);
    setModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setSelectedKnowledge(null);
    setModalOpen(false);
  };

  const handleViewKnowledge = (knowledge: BaseConhecimento) => {
    setSelectedKnowledge(knowledge);
    setViewModalOpen(true);
  };

  const handleEditKnowledge = (knowledge: BaseConhecimento) => {
    setSelectedKnowledge(knowledge);
    setModalOpen(true);
  };

  const handleDeleteKnowledge = async (knowledgeId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este conhecimento?')) {
      try {
        await new Promise<void>((resolve, reject) => {
          deletarConhecimento(knowledgeId, {
            onSuccess: () => {
              toast.success('Conhecimento excluído com sucesso!');
              resolve();
            },
            onError: (error) => {
              toast.error('Erro ao excluir conhecimento.');
              reject(error);
            }
          });
        });
      } catch (err) {
        console.error('Error deleting knowledge:', err);
      }
    }
  };

  const columns: GridColDef[] = [
    { 
      field: 'titulo', 
      headerName: 'Título', 
      flex: 1,
      minWidth: 200
    },
    { 
      field: 'categoria', 
      headerName: 'Categoria', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'ativo' ? 'success' : 'default'}
        />
      )
    },
    { 
      field: 'ultima_atualizacao', 
      headerName: 'Última Atualização', 
      width: 200,
      valueFormatter: (value: string) => new Date(value).toLocaleString('pt-BR'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Eye size={16} />}
          label="Visualizar"
          onClick={() => handleViewKnowledge(params.row)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<Edit size={16} />}
          label="Editar"
          onClick={() => handleEditKnowledge(params.row)}
        />,
        <GridActionsCellItem
          key="delete"
          icon={<Trash2 size={16} />}
          label="Excluir"
          onClick={() => handleDeleteKnowledge(params.row.id)}
        />,
      ],
    },
  ];

  const handleFormSubmit = async (data: CriarBaseConhecimento) => {
    try {
      if (selectedKnowledge) {
        // Modo edição
        await new Promise((resolve, reject) => {
          atualizarConhecimento({ id: selectedKnowledge.id, dados: data }, {
            onSuccess: () => {
              handleCloseModal();
              toast.success('Conhecimento atualizado com sucesso!');
              resolve(true);
            },
            onError: (error) => {
              toast.error('Erro ao atualizar conhecimento.');
              reject(error);
            }
          });
        });
      } else {
        // Modo criação
        await new Promise((resolve, reject) => {
          criarConhecimento(data, {
            onSuccess: () => {
              handleCloseModal();
              toast.success('Conhecimento criado com sucesso!');
              resolve(true);
            },
            onError: (error) => {
              toast.error('Erro ao criar conhecimento.');
              reject(error);
            }
          });
        });
      }
    } catch (error) {
      console.error('Erro ao salvar conhecimento:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Base de Conhecimento da IA
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlusCircle />}
          onClick={handleOpenModal}
        >
          Adicionar Conhecimento
        </Button>
      </Box>
      
      <Paper sx={{ height: 600, width: '100%' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={conhecimentos || []}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
          />
        )}
      </Paper>
      
      <ConhecimentoForm
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        conhecimentoParaEditar={selectedKnowledge}
      />

      {/* Modal de visualização */}
      <Dialog 
        open={viewModalOpen} 
        onClose={() => setViewModalOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedKnowledge?.titulo}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Categoria: {selectedKnowledge?.categoria}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status: {selectedKnowledge?.status}
            </Typography>
            {selectedKnowledge?.palavras_chave && selectedKnowledge.palavras_chave.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Palavras-chave:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedKnowledge.palavras_chave.map((palavra, index) => (
                    <Chip key={index} label={palavra} size="small" />
                  ))}
                </Box>
              </Box>
            )}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Conteúdo:
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {selectedKnowledge?.conteudo}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BaseConhecimentoPage;
