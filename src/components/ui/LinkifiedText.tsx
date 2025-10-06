import { Link } from '@mui/material';

interface LinkifiedTextProps {
  text: string;
}

export function LinkifiedText({ text }: LinkifiedTextProps) {
  // Regex para encontrar URLs (http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          const href = part.startsWith('www.') ? `//${part}` : part;
          return (
            <Link href={href} key={index} target="_blank" rel="noopener noreferrer">
              {part}
            </Link>
          );
        }
        return part;
      })}
    </>
  );
}