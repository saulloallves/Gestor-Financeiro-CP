import {
  Box,
  Typography,
  Grid,
  Chip,
  Paper,
} from '@mui/material';
import {
  Building,
  Hash,
  Phone,
  Mail,
  MapPin,
  Info,
  CheckCircle,
} from 'lucide-react';
import type { Unidade } from '../types/unidades';
import { getStatusLabel, getStatusColor } from '../utils/statusMask';

interface UnidadeInfoBasicasProps {
  unidade: Unidade | null;
}

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <Grid xs={12} sm={6}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  </Grid>
);

export function UnidadeInfoBasicas({ unidade }: UnidadeInfoBasicasProps) {
  if (!unidade) {
    return (
      <Typography color="text.secondary" sx={{ p: 3 }}>
        Informações da unidade não encontradas.
      </Typography>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, backgroundColor: 'background.default' }}>
      <Grid container spacing={3}>
        <InfoItem
          icon={<Building size={20} />}
          label="Nome da Unidade"
          value={unidade.nome_padrao}
        />
        <InfoItem
          icon={<Hash size={20} />}
          label="CNPJ"
          value={unidade.cnpj}
        />
        <InfoItem
          icon={<CheckCircle size={20} />}
          label="Status"
          value={
            <Chip
              label={getStatusLabel(unidade.status)}
              color={getStatusColor(unidade.status)}
              size="small"
            />
          }
        />
        <InfoItem
          icon={<Info size={20} />}
          label="Código da Unidade"
          value={unidade.codigo_unidade}
        />
        <InfoItem
          icon={<Phone size={20} />}
          label="Telefone Comercial"
          value={unidade.telefone_comercial}
        />
        <InfoItem
          icon={<Mail size={20} />}
          label="Email Comercial"
          value={unidade.email_comercial}
        />
        <Grid xs={12}>
          <InfoItem
            icon={<MapPin size={20} />}
            label="Endereço Completo"
            value={`${unidade.endereco_rua || ''}, ${unidade.endereco_numero || ''} - ${unidade.endereco_bairro || ''}, ${unidade.endereco_cidade || ''} - ${unidade.endereco_uf || ''}, ${unidade.endereco_cep || ''}`}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}