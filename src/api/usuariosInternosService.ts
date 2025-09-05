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

  // Criar novo usuário interno
  static async criarUsuario(usuario: UsuarioInternoCreate): Promise<UsuarioInterno> {
    // 1. Criar usuário no auth.users primeiro
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: usuario.email,
      password: usuario.senha || this.gerarSenhaTemporaria(),
      options: {
        emailRedirectTo: undefined, // Não redirecionar
      },
    });

    if (authError) {
      throw new Error(`Erro ao criar conta de autenticação: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Erro ao criar usuário: dados de autenticação inválidos");
    }

    try {
      // 2. Criar registro na tabela usuarios_internos
      const { data, error } = await supabase
        .from("usuarios_internos")
        .insert({
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          perfil: usuario.perfil,
          equipe_id: usuario.equipe_id,
          status: usuario.status || "ativo",
          user_id: authData.user.id,
        })
        .select()
        .single();

      if (error) {
        // Se falhar, tentar limpar o usuário do auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Erro ao criar usuário interno: ${error.message}`);
      }

      return data;
    } catch (error) {
      // Limpar usuário do auth em caso de erro
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw error;
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

  // Gerar senha temporária
  private static gerarSenhaTemporaria(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
}
