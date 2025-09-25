import { supabase } from './supabaseClient';
import type { Comunicacao } from '../types/comunicacao';

class ComunicacoesService {
  async getLogs(filters: any = {}): Promise<Comunicacao[]> {
    let query = supabase
      .from('comunicacoes')
      .select('*')
      .order('data_envio', { ascending: false });

    // Adicionar filtros aqui no futuro
    if (filters.unidade_codigo_unidade) {
      query = query.eq('unidade_codigo_unidade', filters.unidade_codigo_unidade);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const comunicacoesService = new ComunicacoesService();