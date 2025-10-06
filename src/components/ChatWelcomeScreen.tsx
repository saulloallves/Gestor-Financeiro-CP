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
        p: 3,
        textAlign: 'center',
      }}
    >
      <img
        src={logoPrincipal}
        alt="Logo Cresci e Perdi"
        style={{
          maxWidth: '150px',
          height: 'auto',
          marginBottom: theme.spacing(3),
        }}
      />
      <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
        Como posso ajudar?
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Você pode me fazer perguntas sobre o sistema ou clicar em uma das sugestões abaixo.
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 1.5,
          maxWidth: '80%',
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