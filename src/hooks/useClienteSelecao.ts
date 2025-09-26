// Hooks específicos para seleção de clientes no formulário de cobrança
// REFATORADO PARA USAR CACHE-FIRST

import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import type { ClienteSelecionado } from '../types/cobrancas';

/**
 * Hook para buscar franqueados ativos do cache para seleção
 */
export function useFranqueadosParaSelecao() {
  const { franqueados, sync } = useDataStore();

  const data = useMemo(() => {
    return franqueados
      .filter(f => f.is_active_system === true) // CORREÇÃO: Usando a coluna booleana correta
      .map((franqueado): ClienteSelecionado => ({
        id: franqueado.id,
        nome: franqueado.nome,
        documento: franqueado.cpf,
        email: franqueado.email_comercial || franqueado.email_pessoal,
        telefone: franqueado.telefone || franqueado.whatsapp,
        tipo: 'cpf' as const,
      }));
  }, [franqueados]);

  return {
    data,
    isLoading: sync.isLoading,
  };
}

/**
 * Hook para buscar unidades ativas do cache para seleção
 */
export function useUnidadesParaSelecao() {
  const { unidades, sync } = useDataStore();

  const data = useMemo(() => {
    return unidades
      .filter(u => u.status === 'OPERAÇÃO' && u.cnpj)
      .map((unidade): ClienteSelecionado => ({
        id: parseInt(unidade.codigo_unidade),
        nome: unidade.nome_padrao,
        documento: unidade.cnpj!,
        email: unidade.email_comercial,
        telefone: unidade.telefone_comercial,
        tipo: 'cnpj' as const,
      }));
  }, [unidades]);

  return {
    data,
    isLoading: sync.isLoading,
  };
}