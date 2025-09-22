import { supabase } from './supabaseClient';
import type { BaseConhecimento, CriarBaseConhecimento } from '../types/ia.ts';

class IaService {
  async getConhecimentos(): Promise<BaseConhecimento[]> {
    const { data, error } = await supabase
      .from('base_conhecimento')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }

  async createConhecimento(novoConhecimento: CriarBaseConhecimento): Promise<BaseConhecimento> {
    const { data, error } = await supabase
      .from('base_conhecimento')
      .insert({
        ...novoConhecimento,
        criado_por: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conhecimento:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async updateConhecimento(id: string, dadosAtualizados: Partial<CriarBaseConhecimento>): Promise<BaseConhecimento> {
    const { data, error } = await supabase
      .from('base_conhecimento')
      .update(dadosAtualizados)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conhecimento:', error);
      throw new Error(error.message);
    }
    return data;
  }

  async deleteConhecimento(id: string): Promise<void> {
    const { error } = await supabase
      .from('base_conhecimento')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar conhecimento:', error);
      throw new Error(error.message);
    }
  }
}

export const iaService = new IaService();
