import { Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import logoPrincipal from '../assets/logo-principal.png';

interface ChatWelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
  variant?: 'page' | 'widget';
}

const suggestions = [
  "Quantas cobranças vencidas existem?",
  "Quais os detalhes da unidade 1659?",
  "Liste as cobranças da unidade 2546.",
  "Quais são as estatísticas do sistema?",
  "Envie um lembrete de vencimento para a cobrança ID 'uuid-da-cobranca-aqui'",
  "Marque a cobrança ID 'uuid-da-cobranca-aqui' como 'negociado'",
];

export function ChatWelcomeScreen({ onSuggestionClick, variant = 'page' }: ChatWelcomeScreenProps) {
  const theme = useTheme();
  const isWidget = variant === 'widget';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
        pt: isWidget ? 2 : { xs: 2, sm: 3 }, // Padding-top reduzido para o widget
        px: isWidget ? 1.5 : { xs: 2, sm: 3 },
        pb: isWidget ? 3 : { xs: 2, sm: 3 }, // Padding-bottom aumentado para o widget
        textAlign: 'center',
      }}
    >
      <Box
        component="img"
        src={logoPrincipal}
        alt="Logo Cresci e Perdi"
        sx={{
          maxWidth: isWidget ? '80px' : '150px',
          height: 'auto',
          objectFit: 'contain',
          mb: isWidget ? 1 : 2,
        }}
      />
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 1,
          fontWeight: 600,
          fontSize: isWidget ? '1.1rem' : '1.5rem',
        }}
      >
        Como posso ajudar?
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: isWidget ? 2 : 3,
          fontSize: isWidget ? '0.8rem' : '1rem',
        }}
      >
        Você pode me fazer perguntas sobre o sistema ou clicar em uma das sugestões abaixo.
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1,
          maxWidth: '100%',
        }}
      >
        {suggestions.map((text) => (
          <Chip
            key={text}
            label={text}
            onClick={() => onSuggestionClick(text)}
            sx={{
              cursor: 'pointer',
              backgroundColor: 'background.default',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}