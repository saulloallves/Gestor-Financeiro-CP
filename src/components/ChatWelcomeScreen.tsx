import { Box, Typography, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import logoPrincipal from '../assets/logo-principal.png';

interface ChatWelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "Quantas cobranças vencidas existem?",
  "Quais os detalhes da unidade 1659?",
  "Liste as cobranças da unidade 2546.",
  "Quais são as estatísticas do sistema?",
  "Envie um lembrete de vencimento para a cobrança ID 'uuid-da-cobranca-aqui'",
  "Marque a cobrança ID 'uuid-da-cobranca-aqui' como 'negociado'",
];

export function ChatWelcomeScreen({ onSuggestionClick }: ChatWelcomeScreenProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        p: { xs: 2, sm: 3 }, // Padding responsivo
        textAlign: 'center',
      }}
    >
      <Box
        component="img"
        src={logoPrincipal}
        alt="Logo Cresci e Perdi"
        sx={{
          maxWidth: { xs: '120px', sm: '150px' }, // Tamanho do logo responsivo
          height: 'auto',
          mb: { xs: 2, sm: 3 }, // Margem responsiva
        }}
      />
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 1.5, 
          fontWeight: 600,
          fontSize: { xs: '1.25rem', sm: '1.5rem' } // Fonte responsiva
        }}
      >
        Como posso ajudar?
      </Typography>
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ 
          mb: { xs: 3, sm: 4 }, // Margem responsiva
          fontSize: { xs: '0.875rem', sm: '1rem' } // Fonte responsiva
        }}
      >
        Você pode me fazer perguntas sobre o sistema ou clicar em uma das sugestões abaixo.
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: { xs: 1, sm: 1.5 }, // Espaçamento responsivo
          maxWidth: { xs: '100%', sm: '80%' }, // Largura máxima responsiva
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