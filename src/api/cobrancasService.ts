import { supabase } from './supabaseClient';
import { asaasService } from './asaasService';
import { configuracoesService } from './configuracoesService';
import { iaService } from './iaService'; // Importar o serviço da IA
import { format } from 'date-fns';
import type { 
  Cobranca, 
  CriarCobrancaData, 
  EditarCobrancaData, 
  CobrancasFilters,
  NegociacaoCobranca,
  CobrancaFormData 
} from '../types/cobrancas';

class CobrancasService {

  /**
   * Helper privado para obter o ID do usuário interno logado.
   */
  private async _getCurrentUsuarioInternoId(): Promise<string> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Usuário não autenticado.');
    }

    const { data: usuarioInterno, error: dbError } = await supabase
      .from('usuarios_internos')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (dbError || !usuarioInterno) {
      throw new Error('Perfil de usuário interno não encontrado para a sessão atual.');
    }

    return usuarioInterno.id;
  }

  async listarCobrancas(filters?: CobrancasFilters): Promise<Cobranca[]> {
    let query = supabase
      .from('cobrancas')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.codigo_unidade) {
      query = query.eq('codigo_unidade', filters.codigo_unidade);
    }

    if (filters?.tipo_cobranca) {
      query = query.eq('tipo_cobranca', filters.tipo_cobranca);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.data_vencimento_inicio) {
      query = query.gte('vencimento', filters.data_vencimento_inicio);
    }

    if (filters?.data_vencimento_fim) {
      query = query.lte('vencimento', filters.data_vencimento_fim);
    }

    if (filters?.valor_minimo) {
      query = query.gte('valor_atualizado', filters.valor_minimo);
    }

    if (filters?.valor_maximo) {
      query = query.lte('valor_atualizado', filters.valor_maximo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async obterCobranca(id: string): Promise<Cobranca | null> {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }

  async criarCobranca(dados: CriarCobrancaData): Promise<Cobranca> {
    const usuarioInternoId = await this._getCurrentUsuarioInternoId();

    const cobrancaData = {
      ...dados,
      valor_atualizado: dados.valor_original,
      status: 'pendente' as const,
      juros_aplicado: 0,
      multa_aplicada: 0,
      dias_atraso: 0,
      // created_by: usuarioInternoId, // Removido para corrigir erro TS
    };

    // Criar cobrança no banco local primeiro
    const { data: cobranca, error } = await supabase
      .from('cobrancas')
      .insert(cobrancaData)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Fluxo 2: Alimentação automática da base de conhecimento
    try {
      const titulo = `Cobrança #${cobranca.id.substring(0, 8)} criada`;
      const conteudo = `Uma nova cobrança do tipo "${cobranca.tipo_cobranca}" no valor de R$ ${cobranca.valor_original} foi criada para a unidade ${cobranca.codigo_unidade} com vencimento em ${new Date(cobranca.vencimento).toLocaleDateString('pt-BR')}.`;
      await iaService.adicionarEvento(titulo, 'cobrancas', conteudo, ['cobranca', 'criacao', `unidade_${cobranca.codigo_unidade}`]);
    } catch (iaError) {
      console.warn('Falha ao registrar evento na base de conhecimento:', iaError);
    }

    return cobranca;
  }

  // ...rest of the file unchanged
}

export const cobrancasService = new CobrancasService();