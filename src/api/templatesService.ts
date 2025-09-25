import { supabase } from './supabaseClient';
import type { Template, TemplateFormData } from '../types/comunicacao';

class TemplatesService {
  async getTemplates(): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('nome', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async createTemplate(templateData: TemplateFormData): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .insert(templateData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateTemplate(id: string, templateData: Partial<TemplateFormData>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .update(templateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async testTemplate(cobranca_id: string, template_name: string, phone_number?: string) {
    const { data, error } = await supabase.functions.invoke('testar-template-whatsapp', {
      body: { cobranca_id, template_name, phone_number },
    });

    if (error) {
      const contextError = (error as any).context?.error;
      if (contextError) {
        throw new Error(contextError.message || 'Erro na função de teste.');
      }
      throw new Error(error.message);
    }
    return data;
  }
}

export const templatesService = new TemplatesService();