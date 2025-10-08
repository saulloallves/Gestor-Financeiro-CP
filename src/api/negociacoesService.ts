import { supabase } from './supabaseClient';
import type { Negociacao, InteracaoNegociacao } from '../types/negociacoes';

class NegociacoesService {
  async getNegociacoes(): Promise<Negociacao[]> {
    const { data, error } = await supabase
      .from('negociacoes')
      .select(`
        *,
        cobrancas (id, valor_atualizado, codigo_unidade),
        franqueados (id, nome)
      `)
      .order('ultima_interacao', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getInteracoes(negociacaoId: string): Promise<InteracaoNegociacao[]> {
    const { data, error } = await supabase
      .from('interacoes_negociacao')
      .select('*')
      .eq('negociacao_id', negociacaoId)
      .order('data_hora', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const negociacoesService = new NegociacoesService();