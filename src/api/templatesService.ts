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
}

export const templatesService = new TemplatesService();