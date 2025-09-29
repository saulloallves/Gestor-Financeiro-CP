import { supabase } from './supabaseClient';
import type { IaPrompt, IaPromptUpdate } from '../types/ia';

class IaPromptsService {
  async getPrompts(): Promise<IaPrompt[]> {
    const { data, error } = await supabase
      .from('ia_prompts')
      .select('*')
      .order('nome_agente', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async updatePrompt(id: string, updates: IaPromptUpdate): Promise<IaPrompt> {
    const { data, error } = await supabase
      .from('ia_prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}

export const iaPromptsService = new IaPromptsService();