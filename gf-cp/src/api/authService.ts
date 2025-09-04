import { supabase } from './supabaseClient';
import type { LoginInternoData, LoginFranqueadoData, Usuario, UnidadeVinculada } from '../types/auth';

interface UsuarioInternoData {
  id: number;
  nome: string;
  email: string;
  perfil: string;
}

interface FranqueadoData {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  user_id?: string;
  unidades_vinculadas?: Array<{
    id: string;
    codigo: string;
    nome: string;
    status: string;
  }>; // JSONB da função
}

export class AuthService {
  /**
   * Login para usuários internos (equipe administrativa)
   * Usando uma abordagem que funciona com RLS
   */
  static async loginInterno(dados: LoginInternoData): Promise<Usuario> {
    try {
      // 1. Autentica no Supabase Auth primeiro
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: dados.email,
        password: dados.senha,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Falha na autenticação');
      }

      // 2. Aguarda um pouco para garantir que a sessão foi estabelecida
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Usa função customizada que bypassa RLS
      const { data: userData, error: userError } = await supabase
        // @ts-expect-error - Função RPC customizada não reconhecida pelos tipos gerados
        .rpc('get_internal_user_data', { user_uuid: authData.user.id }) as { 
          data: UsuarioInternoData[] | null, 
          error: Error | null
        };

      if (userError) {
        console.error('Erro ao buscar usuário interno:', userError);
        await supabase.auth.signOut();
        throw new Error(`Erro na consulta: ${userError.message}`);
      }

      if (!userData || userData.length === 0) {
        await supabase.auth.signOut();
        throw new Error('Usuário não autorizado para acesso interno - não encontrado na tabela');
      }

      const user = userData[0]; // pega o primeiro resultado
      return {
        id: String(user.id), // converte number para string
        nome: user.nome,
        email: user.email,
        perfil: user.perfil as 'admin' | 'cobranca' | 'gestao',
      };

    } catch (error) {
      console.error('Erro no login interno:', error);
      throw error;
    }
  }

  /**
   * Login para usuários franqueados
   * Agora usa email + senha (nova estrutura)
   */
  static async loginFranqueado(dados: LoginFranqueadoData): Promise<Usuario> {
    try {
      // 1. Autentica diretamente com email e senha
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: dados.email,
        password: dados.senha,
      });

      if (authError) {
        console.error('Erro na autenticação:', authError);
        throw new Error('Credenciais inválidas');
      }

      if (!authData.user) {
        throw new Error('Falha na autenticação');
      }

      // 2. Aguarda estabelecimento da sessão
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Busca dados completos do franqueado usando função que bypassa RLS
      const { data: franqueadoData, error: franqueadoError } = await supabase
        // @ts-expect-error - Função RPC customizada não reconhecida pelos tipos gerados
        .rpc('get_franchisee_data', { user_uuid: authData.user.id }) as { 
          data: FranqueadoData[] | null, 
          error: Error | null
        };

      if (franqueadoError) {
        console.error('Erro ao buscar dados do franqueado:', franqueadoError);
        await supabase.auth.signOut();
        throw new Error(`Erro na consulta: ${franqueadoError.message}`);
      }

      if (!franqueadoData || franqueadoData.length === 0) {
        await supabase.auth.signOut();
        throw new Error('Usuário não autorizado como franqueado - não encontrado na tabela');
      }

      const franqueado = franqueadoData[0];
      
      // 4. Processa as unidades vinculadas
      const unidades: UnidadeVinculada[] = Array.isArray(franqueado.unidades_vinculadas) 
        ? franqueado.unidades_vinculadas.map((u) => ({
            id: u.id,
            codigo: u.codigo,
            nome: u.nome,
            status: u.status
          }))
        : [];

      return {
        id: franqueado.id,
        nome: franqueado.nome,
        email: franqueado.email,
        tipo: franqueado.tipo as 'franqueado' | 'gestor' | 'investidor',
        unidades,
      };

    } catch (error) {
      console.error('Erro no login franqueado:', error);
      throw error;
    }
  }

  /**
   * Logout do usuário atual
   */
  static async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout:', error);
        // Não lança erro para não impedir o logout local
      }
    } catch (error) {
      console.error('Erro no logout:', error);
      // Logout local mesmo com erro no Supabase
    }
  }

  /**
   * Verifica se há uma sessão ativa
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Erro ao obter sessão:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }

  /**
   * Obtém o usuário atual da sessão
   */
  static async getCurrentUser(): Promise<Usuario | null> {
    try {
      const session = await this.getSession();
      
      if (!session?.user) {
        return null;
      }

      // Primeiro tenta buscar como usuário interno usando função que bypassa RLS
      const { data: userData, error: userError } = await supabase
        // @ts-expect-error - Função RPC customizada não reconhecida pelos tipos gerados
        .rpc('get_internal_user_data', { user_uuid: session.user.id }) as { 
          data: UsuarioInternoData[] | null, 
          error: Error | null
        };

      if (!userError && userData && userData.length > 0) {
        const user = userData[0];
        return {
          id: String(user.id),
          nome: user.nome,
          email: user.email,
          perfil: user.perfil as 'admin' | 'cobranca' | 'gestao',
        };
      }

      // Se não for usuário interno, tenta buscar como franqueado
      const { data: franqueadoData, error: franqueadoError } = await supabase
        // @ts-expect-error - Função RPC customizada não reconhecida pelos tipos gerados
        .rpc('get_franchisee_data', { user_uuid: session.user.id }) as { 
          data: FranqueadoData[] | null, 
          error: Error | null
        };

      if (!franqueadoError && franqueadoData && franqueadoData.length > 0) {
        const franqueado = franqueadoData[0];
        
        // Processa as unidades vinculadas
        const unidades: UnidadeVinculada[] = Array.isArray(franqueado.unidades_vinculadas) 
          ? franqueado.unidades_vinculadas.map((u) => ({
              id: u.id,
              codigo: u.codigo,
              nome: u.nome,
              status: u.status
            }))
          : [];

        return {
          id: franqueado.id,
          nome: franqueado.nome,
          email: franqueado.email,
          tipo: franqueado.tipo as 'franqueado' | 'gestor' | 'investidor',
          unidades,
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  /**
   * Verifica se o Supabase está configurado
   */
  static isSupabaseConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(url && key && url !== 'your_supabase_url_here' && key !== 'your_supabase_anon_key_here');
  }
}
