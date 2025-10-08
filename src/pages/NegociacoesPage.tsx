import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Eye } from 'lucide-react';
import { DataGrid, GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useNegociacoes } from '../hooks/useNegociacoes';
import { NegociacaoDetalhesModal } from '../components/NegociacaoDetalhesModal';
import type { Negociacao, NegociacaoStatus } from '../types/negociacoes';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusStyles: Record<NegociacaoStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' }> = {
  em_andamento: { label: 'Em Andamento', color: 'primary' },
  aceita: { label: 'Aceita', color: 'success' },
  recusada: { label: 'Recusada', color: 'error' },
  escalada: { label: 'Escalada', color: 'warning' },
  cancelada: { label: 'Cancelada', color: 'default' },
};

export function NegociacoesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNegociacao, setSelectedNegociacao] = useState<Negociacao | null>(null);
  const { data: negociacoes, isLoading } = useNegociacoes();

  const handleViewDetails = (negociacao: Negociacao) => {
    setSelectedNegociacao(negociacao);
    setModalOpen(true);
  };

  const columns: GridColDef[] = [
    {
      field: 'franqueado',
      headerName: 'Franqueado',
      flex: 1,
      valueGetter: (_value, row: Negociacao) => row.franqueados?.nome,
    },
    {
      field: 'unidade',
      headerName: 'Unidade',
      width: 120,
      valueGetter: (_value, row: Negociacao) => row.cobrancas?.codigo_unidade,
    },
    {
      field: 'valor',
      headerName: 'Valor da Dívida',
      width: 180,
      valueGetter: (_value, row: Negociacao) => row.cobrancas?.valor_atualizado,
      renderCell: (params) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(params.value),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const status = params.value as NegociacaoStatus;
        const style = statusStyles[status] || { label: status, color: 'default' };
        return <Chip label={style.label} color={style.color} size="small" />;
      },
    },
    {
      field: 'ultima_interacao',
      headerName: 'Última Interação',
      width: 200,
      valueFormatter: (value: string) => format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Ações',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Eye size={16} />}
          label="Ver Detalhes"
          onClick={() => handleViewDetails(params.row)}
        />,
      ],
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Painel de Negociações da IA
      </Typography>
      <Paper sx={{ height: '75vh', width: '100%' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={negociacoes || []}
            columns={columns}
            disableRowSelectionOnClick
          />
        )}
      </Paper>
      <NegociacaoDetalhesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        negociacao={selectedNegociacao}
      />
    </Box>
  );
}