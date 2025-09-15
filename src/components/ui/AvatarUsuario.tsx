import { Avatar } from '@mui/material';

interface AvatarUsuarioProps {
  nome: string;
  fotoPerfil?: string;
  size?: number;
  fontSize?: string;
}

export function AvatarUsuario({ nome, fotoPerfil, size = 40, fontSize = "0.875rem" }: AvatarUsuarioProps) {
  const getInitials = (nomeCompleto: string) => {
    return nomeCompleto
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (fotoPerfil) {
    return (
      <Avatar
        src={fotoPerfil}
        alt={nome}
        sx={{
          width: size,
          height: size,
          flexShrink: 0,
        }}
      >
        {getInitials(nome)}
      </Avatar>
    );
  }

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: "primary.main",
        fontSize: fontSize,
        flexShrink: 0,
      }}
    >
      {getInitials(nome)}
    </Avatar>
  );
}