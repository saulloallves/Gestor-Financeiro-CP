import { supabase } from "./supabaseClient";
import type {
  UsuarioInterno,
  UsuarioInternoCreate,
  UsuarioInternoUpdate,
  UsuarioInternoListItem,
  FiltrosUsuarios,
  EstatisticasUsuarios,
} from "../types/equipes";

// ==============================================
// SERVIÇOS PARA USUÁRIOS INTERNOS
// ==============================================

export class UsuariosInternosService {
  
  // Buscar todos os usuários internos com filtros opcionais
  static async buscarUsuarios(filtros?: FiltrosUsuarios): Promise<UsuarioInternoListItem[]> {
    let query = supabase
      .from("usuarios_internos")
      .select(`
        *,
        equipes!left(
          id,
          nome_equipe
        )
      `)
      .order("nome", { ascending: true });

    // Aplicar filtros
    if (filtros?.equipe_id) {
      query = query.eq("equipe_id", filtros.equipe_id);
    }

    if (filtros?.perfil) {
      query = query.eq("perfil", filtros.perfil);
    }

    if (filtros?.status) {
      query = query.eq("status", filtros.status);
    }

    if (filtros?.termo_busca) {
      query = query.or(
        `nome.ilike.%${filtros.termo_busca}%,email.ilike.%${filtros.termo_busca}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar usuários: ${error.message}`);
    }

    // Mapear dados incluindo o nome da equipe
    return (data || []).map((usuario: UsuarioInterno & { equipes?: { nome_equipe: string } }) => ({
      ...usuario,
      equipe_nome: usuario.equipes?.nome_equipe,
    }));
  }

  // Buscar usuário por ID
  static async buscarUsuarioPorId(id: string): Promise<UsuarioInterno | null> {
    const { data, error } = await supabase
      .from("usuarios_internos")
      .select(`
        *,
        equipes!left(
          id,
          nome_equipe,
          descricao
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Erro ao buscar usuário: ${error.message}`);
    }

    return {
      ...data,
      equipe: data.equipes || undefined,
    };
  }

  // Buscar usuário por user_id (auth.users)
  static async buscarUsuarioPorAuthId(userId: string): Promise<UsuarioInterno | null> {
    const { data, error } = await supabase
      .from("usuarios_internos")
      .select(`
        *,
        equipes!left(
          id,
          nome_equipe,
          descricao
        )
      `)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Erro ao buscar usuário por auth ID: ${error.message}`);
    }

    return {
      ...data,
      equipe: data.equipes || undefined,
    };
  }

  // Verificar se email já existe
  static async verificarEmailExiste(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('verificar_email_existe', {
        p_email: email
      });

      if (error) {
        console.error('Erro ao verificar email:', error);
        throw error;
      }

      // A função retorna um objeto JSON com informações sobre onde o email existe
      return data?.exists || false;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      // Em caso de erro, assumir que o email não existe para não bloquear o cadastro
      return false;
    }
  }

  // Criar novo usuário interno
  static async criarUsuario(usuario: UsuarioInternoCreate): Promise<UsuarioInterno> {
    try {
      // Verificar se o email já existe
      const emailExiste = await this.verificarEmailExiste(usuario.email);
      if (emailExiste) {
        throw new Error('Este email já está cadastrado no sistema. Use um email diferente.');
      }

      // Usar função do banco para criar usuário com autenticação
      const { data, error } = await supabase.rpc('create_usuario_interno_with_auth', {
        p_nome: usuario.nome,
        p_email: usuario.email,
        p_telefone: usuario.telefone || null,
        p_perfil: usuario.perfil,
        p_equipe_id: usuario.equipe_id,
        p_senha: usuario.senha || null,
      });

      if (error) {
        throw new Error(`Erro na função de criação: ${error.message}`);
      }

      if (!data) {
        throw new Error('Nenhum dado retornado pela função de criação');
      }

      // Verificar se data é string (JSON) e fazer parse se necessário
      let result = data;
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch {
          throw new Error('Resposta da função em formato inválido');
        }
      }

      if (!result.success) {
        // Melhorar mensagem de erro para email duplicado
        if (result.error && result.error.includes('já está em uso')) {
          throw new Error(`Este email já está cadastrado no sistema. Use um email diferente.`);
        }
        throw new Error(result.message || result.error || 'Erro desconhecido ao criar usuário');
      }

      // 🔑 TEMPORÁRIO: Exibir senha gerada no console
      if (result.senha_temporaria) {
        console.log('🔑 SENHA TEMPORÁRIA GERADA (REMOVER EM PRODUÇÃO):');
        console.log(`📧 Email: ${result.email}`);
        console.log(`🔐 Senha: ${result.senha_temporaria}`);
        console.log('⚠️  IMPORTANTE: Guarde esta senha, ela não será exibida novamente!');
      }

      // Buscar o usuário criado para retornar os dados completos
      const usuarioCompleto = await this.buscarUsuarioPorAuthId(result.user_id);
      if (!usuarioCompleto) {
        throw new Error('Usuário criado, mas não foi possível recuperar os dados');
      }

      return usuarioCompleto;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro ao criar usuário interno: ${error.message}`);
      }
      throw new Error('Erro ao criar usuário interno');
    }
  }

  // Atualizar usuário interno
  static async atualizarUsuario(id: string, updates: UsuarioInternoUpdate): Promise<UsuarioInterno> {
    const { data, error } = await supabase
      .from("usuarios_internos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }

    return data;
  }

  // Inativar usuário (soft delete)
  static async inativarUsuario(id: string): Promise<void> {
    const { error } = await supabase
      .from("usuarios_internos")
      .update({ status: "inativo" })
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao inativar usuário: ${error.message}`);
    }
  }

  // Ativar usuário
  static async ativarUsuario(id: string): Promise<void> {
    const { error } = await supabase
      .from("usuarios_internos")
      .update({ status: "ativo" })
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao ativar usuário: ${error.message}`);
    }
  }

  // Atualizar último login
  static async atualizarUltimoLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from("usuarios_internos")
      .update({ ultimo_login: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      console.error("Erro ao atualizar último login:", error.message);
    }
  }

  // Listar emails já cadastrados (para debug)
  static async listarEmailsCadastrados(): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('listar_emails_cadastrados');

      if (error) {
        console.error('Erro ao listar emails:', error);
        return [];
      }

      // A função retorna um objeto JSON com array de emails
      return data?.emails || [];
    } catch (error) {
      console.error('Erro ao listar emails:', error);
      return [];
    }
  }

  // Verificar se email já existe
  static async emailExiste(email: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from("usuarios_internos")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao verificar email: ${error.message}`);
    }

    return data && data.length > 0;
  }

  // Buscar usuários por equipe
  static async buscarUsuariosPorEquipe(equipeId: string): Promise<UsuarioInterno[]> {
    const { data, error } = await supabase
      .from("usuarios_internos")
      .select("*")
      .eq("equipe_id", equipeId)
      .eq("status", "ativo")
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar usuários da equipe: ${error.message}`);
    }

    return data || [];
  }

  // Obter estatísticas dos usuários
  static async obterEstatisticas(): Promise<EstatisticasUsuarios> {
    const { data, error } = await supabase
      .from("usuarios_internos")
      .select("status, perfil, equipe_id");

    if (error) {
      throw new Error(`Erro ao buscar estatísticas de usuários: ${error.message}`);
    }

    if (!data) {
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        por_perfil: {
          operador: 0,
          gestor: 0,
          juridico: 0,
          admin: 0,
        },
        por_equipe: {},
      };
    }

    const total = data.length;
    const ativos = data.filter(u => u.status === "ativo").length;
    const inativos = total - ativos;

    const por_perfil = data.reduce((acc, usuario) => {
      acc[usuario.perfil] = (acc[usuario.perfil] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const por_equipe = data.reduce((acc, usuario) => {
      if (usuario.equipe_id) {
        acc[usuario.equipe_id] = (acc[usuario.equipe_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      ativos,
      inativos,
      por_perfil: {
        operador: por_perfil.operador || 0,
        gestor: por_perfil.gestor || 0,
        juridico: por_perfil.juridico || 0,
        admin: por_perfil.admin || 0,
      },
      por_equipe,
    };
  }

  // Resetar senha do usuário
  static async resetarSenha(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(`Erro ao resetar senha: ${error.message}`);
    }
  }

  // Limpar usuários órfãos (auth.users sem registro em usuarios_internos)
  static async limparUsuariosOrfaos(): Promise<{
    success: boolean;
    deleted_count?: number;
    message?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('cleanup_orphan_auth_users');
      
      if (error) {
        throw error;
      }

      return data;
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao limpar usuários órfãos',
        message: 'Falha na limpeza de usuários órfãos'
      };
    }
  }
}
