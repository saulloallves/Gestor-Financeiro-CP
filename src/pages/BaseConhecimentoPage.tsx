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
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { PlusCircle, Edit, Eye, Archive, ArchiveRestore } from 'lucide-react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { 
  useBaseConhecimento, 
  useVersoesConhecimento, 
  useLogsConsulta 
} from '../hooks/useBaseConhecimento';
import { ConhecimentoForm } from '../components/ConhecimentoForm';
import type { CriarBaseConhecimento, BaseConhecimento } from '../types/ia';
import toast from 'react-hot-toast';

const BaseConhecimentoPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState<BaseConhecimento | null>(null);
  const [incluirInativos, setIncluirInativos] = useState(false);

  const { 
    conhecimentos, 
    isLoading, 
    criarConhecimento, 
    atualizarConhecimento,
    inativarConhecimento,
    ativarConhecimento
  } = useBaseConhecimento(incluirInativos);

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

  const handleToggleStatus = async (knowledge: BaseConhecimento) => {
    const action = knowledge.status === 'ativo' ? inativarConhecimento : ativarConhecimento;
    const successMessage = knowledge.status === 'ativo' ? 'Conhecimento inativado!' : 'Conhecimento ativado!';
    const errorMessage = `Erro ao ${knowledge.status === 'ativo' ? 'inativar' : 'ativar'} conhecimento.`;

    try {
      await new Promise<void>((resolve, reject) => {
        action(knowledge.id, {
          onSuccess: () => {
            toast.success(successMessage);
            resolve();
          },
          onError: (error) => {
            toast.error(errorMessage);
            reject(error);
          }
        });
      });
    } catch (err) {
      console.error('Erro ao alterar status:', err);
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
        params.row.status === 'ativo' ? (
          <GridActionsCellItem
            key="inactivate"
            icon={<Archive size={16} />}
            label="Inativar"
            onClick={() => handleToggleStatus(params.row)}
          />
        ) : (
          <GridActionsCellItem
            key="activate"
            icon={<ArchiveRestore size={16} />}
            label="Ativar"
            onClick={() => handleToggleStatus(params.row)}
          />
        ),
      ],
    },
  ];

  const handleFormSubmit = async (data: CriarBaseConhecimento) => {
    try {
      if (selectedKnowledge) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControlLabel
          control={<Switch checked={incluirInativos} onChange={(e) => setIncluirInativos(e.target.checked)} />}
          label="Incluir inativos"
        />
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

      <VisualizacaoConhecimentoModal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        conhecimento={selectedKnowledge}
      />
    </Container>
  );
};

// Componente para o modal de visualização
const VisualizacaoConhecimentoModal = ({ open, onClose, conhecimento }: { open: boolean, onClose: () => void, conhecimento: BaseConhecimento | null }) => {
  const [activeTab, setActiveTab] = useState('conteudo');
  const { data: versoes, isLoading: isLoadingVersoes } = useVersoesConhecimento(conhecimento?.id || null);
  const { data: logs, isLoading: isLoadingLogs } = useLogsConsulta(conhecimento?.id || null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{conhecimento?.titulo}</DialogTitle>
      <DialogContent>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Conteúdo" value="conteudo" />
          <Tab label={`Histórico (${versoes?.length || 0})`} value="historico" />
          <Tab label={`Acessos da IA (${logs?.length || 0})`} value="logs" />
        </Tabs>

        {activeTab === 'conteudo' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Categoria: {conhecimento?.categoria}</Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status: {conhecimento?.status}</Typography>
            {conhecimento?.palavras_chave && conhecimento.palavras_chave.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Palavras-chave:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {conhecimento.palavras_chave.map((palavra, index) => <Chip key={index} label={palavra} size="small" />)}
                </Box>
              </Box>
            )}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Conteúdo:</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{conhecimento?.conteudo}</Typography>
          </Box>
        )}

        {activeTab === 'historico' && (
          <Box sx={{ mt: 2 }}>
            {isLoadingVersoes ? <CircularProgress /> : (
              <List>
                {versoes?.map(v => (
                  <ListItem key={v.id} divider>
                    <ListItemText
                      primary={`Alterado em ${new Date(v.data_alteracao).toLocaleString('pt-BR')}`}
                      secondary={`Por: ${v.atualizado_por || 'Sistema'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {activeTab === 'logs' && (
          <Box sx={{ mt: 2 }}>
            {isLoadingLogs ? <CircularProgress /> : (
              <List>
                {logs?.map(log => (
                  <ListItem key={log.id} divider>
                    <ListItemText
                      primary={`Consultado em ${new Date(log.data_consulta).toLocaleString('pt-BR')}`}
                      secondary={`Agente: ${log.ia_id} | Tipo: ${log.tipo_consulta}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BaseConhecimentoPage;