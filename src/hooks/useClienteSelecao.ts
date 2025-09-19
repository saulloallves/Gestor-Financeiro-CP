// Hooks específicos para seleção de clientes no formulário de cobrança
// Usando cache first e dados otimizados para performance

import { useQuery } from "@tanstack/react-query";
import { franqueadosService } from "../api/franqueadosService";
import { unidadesService } from "../api/unidadesService";
import type { ClienteSelecionado } from "../types/cobrancas";
import type { Franqueado } from "../types/franqueados";
import type { Unidade } from "../types/unidades";

// ================================
// HOOKS PARA SELEÇÃO DE CLIENTES
// ================================

/**
 * Hook para buscar franqueados ativos (somente dados necessários para seleção)
 * Usado no formulário de cobrança quando tipo_cliente = 'cpf'
 */
export function useFranqueadosParaSelecao() {
  return useQuery({
    queryKey: ['franqueados-selecao-ativa'],
    queryFn: async () => {
      const result = await franqueadosService.getFranqueados(
        { status: ['ativo'] }, // Filtro correto como array
        { field: 'nome', direction: 'asc' },
        { page: 1, limit: 200 } // Limite maior para ter todos disponíveis
      );
      
      // Mapear para o formato ClienteSelecionado
      const clientesSelecionados: ClienteSelecionado[] = result.data.map((franqueado: Franqueado) => ({
        id: franqueado.id,
        nome: franqueado.nome,
        documento: franqueado.cpf,
        email: franqueado.email_comercial || franqueado.email_pessoal,
        telefone: franqueado.telefone || franqueado.whatsapp,
        tipo: 'cpf' as const,
      }));

      return clientesSelecionados;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 15 * 60 * 1000, // 15 minutos
    select: (data) => data, // Já está no formato correto
  });
}

/**
 * Hook para buscar unidades ativas (somente dados necessários para seleção)
 * Usado no formulário de cobrança quando tipo_cliente = 'cnpj'
 */
export function useUnidadesParaSelecao() {
  return useQuery({
    queryKey: ['unidades-selecao-ativa'],
    queryFn: async () => {
      const result = await unidadesService.getUnidades(
        { status: ['OPERAÇÃO'] }, // Apenas unidades operacionais
        { field: 'nome_padrao', direction: 'asc' },
        { page: 1, limit: 200 } // Limite maior para ter todas disponíveis
      );
      
      // Mapear para o formato ClienteSelecionado
      const clientesSelecionados: ClienteSelecionado[] = result.data
        .filter((unidade: Unidade) => unidade.cnpj) // Apenas unidades com CNPJ
        .map((unidade: Unidade) => ({
          id: parseInt(unidade.codigo_unidade), // Converter para number
          nome: unidade.nome_padrao,
          documento: unidade.cnpj!,
          email: unidade.email_comercial,
          telefone: unidade.telefone_comercial,
          tipo: 'cnpj' as const,
        }));

      return clientesSelecionados;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 15 * 60 * 1000, // 15 minutos
    select: (data) => data, // Já está no formato correto
  });
}

/**
 * Hook para buscar um franqueado específico por ID
 */
export function useFranqueadoPorId(franqueadoId: string | undefined) {
  return useQuery({
    queryKey: ['franqueado-detalhes', franqueadoId],
    queryFn: () => franqueadosService.getFranqueadoById(franqueadoId!),
    enabled: !!franqueadoId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook para buscar uma unidade específica por ID
 */
export function useUnidadePorId(unidadeId: number | undefined) {
  return useQuery({
    queryKey: ['unidade-detalhes', unidadeId],
    queryFn: () => unidadesService.getUnidadeById(unidadeId!.toString()),
    enabled: !!unidadeId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

/**
 * Hook combinado para buscar dados de cliente baseado no tipo e ID
 */
export function useClienteSelecionado(
  tipoCliente: 'cpf' | 'cnpj' | undefined,
  clienteId: string | number | undefined
) {
  const franqueadoQuery = useFranqueadoPorId(
    tipoCliente === 'cpf' ? clienteId as string : undefined
  );
  
  const unidadeQuery = useUnidadePorId(
    tipoCliente === 'cnpj' ? clienteId as number : undefined
  );

  // Retornar os dados baseados no tipo
  if (tipoCliente === 'cpf') {
    return {
      ...franqueadoQuery,
      data: franqueadoQuery.data ? {
        id: franqueadoQuery.data.id,
        nome: franqueadoQuery.data.nome,
        documento: franqueadoQuery.data.cpf,
        email: franqueadoQuery.data.email_comercial || franqueadoQuery.data.email_pessoal,
        telefone: franqueadoQuery.data.telefone || franqueadoQuery.data.whatsapp,
        tipo: 'cpf' as const,
      } as ClienteSelecionado : undefined,
    };
  } else if (tipoCliente === 'cnpj') {
    return {
      ...unidadeQuery,
      data: unidadeQuery.data ? {
        id: parseInt(unidadeQuery.data.codigo_unidade),
        nome: unidadeQuery.data.nome_padrao,
        documento: unidadeQuery.data.cnpj!,
        email: unidadeQuery.data.email_comercial,
        telefone: unidadeQuery.data.telefone_comercial,
        tipo: 'cnpj' as const,
      } as ClienteSelecionado : undefined,
    };
  }

  // Se não há tipo definido, retornar estado vazio
  return {
    data: undefined,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: true,
  };
}