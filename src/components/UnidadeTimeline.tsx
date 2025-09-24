import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';
import type { Cobranca, StatusCobranca } from '../types/cobrancas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UnidadeTimelineProps {
  cobrancas: Cobranca[];
}

const statusInfo: Record<
  StatusCobranca,
  { icon: React.ElementType; color: 'success' | 'error' | 'warning' | 'info' | 'default' }
> = {
  pago: { icon: CheckCircle, color: 'success' },
  vencido: { icon: AlertTriangle, color: 'error' },
  pendente: { icon: Clock, color: 'warning' },
  em_aberto: { icon: Clock, color: 'warning' },
  atrasado: { icon: AlertTriangle, color: 'error' },
  em_atraso: { icon: AlertTriangle, color: 'error' },
  cancelado: { icon: XCircle, color: 'default' },
  negociado: { icon: FileText, color: 'info' },
  juridico: { icon: AlertTriangle, color: 'error' },
  parcelado: { icon: FileText, color: 'info' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString: string) =>
  format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

export function UnidadeTimeline({ cobrancas }: UnidadeTimelineProps) {
  const theme = useTheme();

  if (cobrancas.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 3 }}>
        <Typography color="text.secondary">
          Nenhuma cobrança encontrada para esta unidade.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', p: 2 }}>
      {/* Linha vertical da timeline */}
      <Box
        sx={{
          position: 'absolute',
          left: '36px',
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: theme.palette.divider,
        }}
      />

      {cobrancas.map((cobranca, index) => {
        const StatusIcon = statusInfo[cobranca.status]?.icon || DollarSign;
        const statusColor = statusInfo[cobranca.status]?.color || 'default';

        return (
          <Box key={cobranca.id} sx={{ display: 'flex', mb: 3, position: 'relative' }}>
            {/* Ponto na timeline */}
            <Box sx={{ flexShrink: 0, mr: 2, zIndex: 1 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: `${statusColor}.main`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  mt: 1.5,
                  ml: 1.5,
                }}
              >
                <StatusIcon size={14} />
              </Box>
            </Box>

            {/* Conteúdo do evento */}
            <Card sx={{ flexGrow: 1, width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {cobranca.observacoes || `Cobrança de ${cobranca.tipo_cobranca}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vencimento: {formatDate(cobranca.vencimento)}
                    </Typography>
                  </Box>
                  <Chip
                    label={cobranca.status.toUpperCase()}
                    color={statusColor}
                    size="small"
                  />
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Valor:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(cobranca.valor_atualizado)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
}