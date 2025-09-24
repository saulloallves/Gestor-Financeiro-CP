import { supabase } from './supabaseClient';
import type { BaseConhecimento, CriarBaseConhecimento } from '../types/ia.ts';

// Tipos para as novas tabelas
export interface VersaoConhecimento {
  id: string;
  conhecimento_id: string;
  conteudo_antigo: BaseConhecimento;
  conteudo_novo: BaseConhecimento;
  atualizado_por: string;
  data_alteracao: string;
}

export interface LogConsultaIA {
  id: string;
  conhecimento_id: string;
  ia_id: string;
  tipo_consulta: string;
  data_consulta: string;
}

class IaService {
  async getConhecimentos(incluirInativos = false): Promise<BaseConhecimento[]> {
    let query = supabase
      .from('base_conhecimento')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (!incluirInativos) {
      query = query.eq('status', 'ativo');
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }

  async createConhecimento(novoConhecimento: CriarBaseConhecimento): Promise<BaseConhecimento> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('base_conhecimento')
      .insert({
        ...novoConhecimento,
        criado_por: user?.id
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

  // Modificado para "soft delete"
  async inativarConhecimento(id: string): Promise<void> {
    const { error } = await supabase
      .from('base_conhecimento')
      .update({ status: 'inativo' })
      .eq('id', id);

    if (error) {
      console.error('Erro ao inativar conhecimento:', error);
      throw new Error(error.message);
    }
  }

  // Nova função para reativar
  async ativarConhecimento(id: string): Promise<void> {
    const { error } = await supabase
      .from('base_conhecimento')
      .update({ status: 'ativo' })
      .eq('id', id);

    if (error) {
      console.error('Erro ao ativar conhecimento:', error);
      throw new Error(error.message);
    }
  }

  // Nova função para buscar histórico de versões
  async getVersoes(conhecimentoId: string): Promise<VersaoConhecimento[]> {
    const { data, error } = await supabase
      .from('versoes_conhecimento')
      .select('*')
      .eq('conhecimento_id', conhecimentoId)
      .order('data_alteracao', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }

  // Nova função para buscar logs de consulta da IA
  async getLogs(conhecimentoId: string): Promise<LogConsultaIA[]> {
    const { data, error } = await supabase
      .from('logs_consultas_ia')
      .select('*')
      .eq('conhecimento_id', conhecimentoId)
      .order('data_consulta', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  }

  // Nova função para alimentação automática
  async adicionarEvento(titulo: string, categoria: CriarBaseConhecimento['categoria'], conteudo: string, palavrasChave: string[] = []) {
    const { error } = await supabase.rpc('adicionar_evento_ao_conhecimento', {
      p_titulo: titulo,
      p_categoria: categoria,
      p_conteudo: conteudo,
      p_palavras_chave: palavrasChave,
    });

    if (error) {
      console.error('Erro ao adicionar evento ao conhecimento:', error);
      // Não lançar erro para não quebrar o fluxo principal
    }
  }

  // Nova função para consulta contextual
  async consultarBase(prompt: string): Promise<BaseConhecimento[]> {
    const { data, error } = await supabase.rpc('consultar_base_conhecimento', {
      p_prompt: prompt,
    });

    if (error) {
      console.error('Erro ao consultar base de conhecimento:', error);
      return [];
    }
    return data || [];
  }
}

export const iaService = new IaService();