import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { EquipesService } from "../api/equipesService";
import type {
  EquipeCreate,
  EquipeUpdate,
  FiltrosEquipes,
} from "../types/equipes";

// ==============================================
// QUERY KEYS
// ==============================================

export const equipesKeys = {
  all: ["equipes"] as const,
  lists: () => [...equipesKeys.all, "list"] as const,
  list: (filters: FiltrosEquipes) => [...equipesKeys.lists(), filters] as const,
  details: () => [...equipesKeys.all, "detail"] as const,
  detail: (id: string) => [...equipesKeys.details(), id] as const,
  ativas: () => [...equipesKeys.all, "ativas"] as const,
  estatisticas: () => [...equipesKeys.all, "estatisticas"] as const,
};

// ==============================================
// HOOKS DE CONSULTA
// ==============================================

// Hook para buscar equipes com filtros
export function useEquipes(filtros?: FiltrosEquipes) {
  return useQuery({
    queryKey: equipesKeys.list(filtros || {}),
    queryFn: () => EquipesService.buscarEquipes(filtros),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar equipe por ID
export function useEquipe(id: string) {
  return useQuery({
    queryKey: equipesKeys.detail(id),
    queryFn: () => EquipesService.buscarEquipePorId(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook para buscar equipes ativas (para selects)
export function useEquipesAtivas() {
  return useQuery({
    queryKey: equipesKeys.ativas(),
    queryFn: () => EquipesService.buscarEquipesAtivas(),
    staleTime: 10 * 60 * 1000, // 10 minutos (dados mais estáveis)
  });
}

// Hook para estatísticas das equipes
export function useEstatisticasEquipes() {
  return useQuery({
    queryKey: equipesKeys.estatisticas(),
    queryFn: () => EquipesService.obterEstatisticas(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// ==============================================
// HOOKS DE MUTAÇÃO
// ==============================================

// Hook para criar equipe
export function useCreateEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (equipe: EquipeCreate) => EquipesService.criarEquipe(equipe),
    onSuccess: (novaEquipe) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: equipesKeys.all });
      
      toast.success(`Equipe "${novaEquipe.nome_equipe}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar equipe: ${error.message}`);
    },
  });
}

// Hook para atualizar equipe
export function useUpdateEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EquipeUpdate }) =>
      EquipesService.atualizarEquipe(id, updates),
    onSuccess: (equipeAtualizada) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: equipesKeys.all });
      
      // Atualizar cache específico
      queryClient.setQueryData(
        equipesKeys.detail(equipeAtualizada.id),
        equipeAtualizada
      );
      
      toast.success(`Equipe "${equipeAtualizada.nome_equipe}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar equipe: ${error.message}`);
    },
  });
}

// Hook para inativar equipe
export function useInativarEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => EquipesService.inativarEquipe(id),
    onSuccess: () => {
      // Invalidar todas as queries de equipes
      queryClient.invalidateQueries({ queryKey: equipesKeys.all });
      
      toast.success("Equipe inativada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao inativar equipe: ${error.message}`);
    },
  });
}

// Hook para ativar equipe
export function useAtivarEquipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => EquipesService.ativarEquipe(id),
    onSuccess: () => {
      // Invalidar todas as queries de equipes
      queryClient.invalidateQueries({ queryKey: equipesKeys.all });
      
      toast.success("Equipe ativada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao ativar equipe: ${error.message}`);
    },
  });
}

// Hook para verificar se pode inativar equipe
export function usePodeInativarEquipe(id: string) {
  return useQuery({
    queryKey: [...equipesKeys.detail(id), "pode-inativar"],
    queryFn: () => EquipesService.podeInativarEquipe(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

// ==============================================
// HOOKS AUXILIARES
// ==============================================

// Hook para buscar equipe com validação de permissão para inativação
export function useEquipeComPermissoes(id: string) {
  const equipeQuery = useEquipe(id);
  const podeInativarQuery = usePodeInativarEquipe(id);

  return {
    equipe: equipeQuery.data,
    podeInativar: podeInativarQuery.data,
    isLoading: equipeQuery.isLoading || podeInativarQuery.isLoading,
    error: equipeQuery.error || podeInativarQuery.error,
  };
}
