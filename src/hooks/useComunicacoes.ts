import { useQuery } from '@tanstack/react-query';
import { comunicacoesService } from '../api/comunicacoesService';

export const useComunicacoes = (filters: any) => {
  return useQuery({
    queryKey: ['comunicacoes', filters],
    queryFn: () => comunicacoesService.getLogs(filters),
  });
};