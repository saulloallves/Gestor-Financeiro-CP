import { supabase } from "./supabaseClient";
import type {
  Equipe,
  EquipeCreate,
  EquipeUpdate,
  FiltrosEquipes,
  EstatisticasEquipes,
} from "../types/equipes";

// ==============================================
// SERVIÇOS PARA EQUIPES
// ==============================================

export class EquipesService {
  
  // Buscar todas as equipes com filtros opcionais
  static async buscarEquipes(filtros?: FiltrosEquipes): Promise<Equipe[]> {
    let query = supabase
      .from("equipes")
      .select("*")
      .order("nome_equipe", { ascending: true });

    // Aplicar filtros
    if (filtros?.status) {
      query = query.eq("status", filtros.status);
    }

    if (filtros?.termo_busca) {
      query = query.or(
        `nome_equipe.ilike.%${filtros.termo_busca}%,descricao.ilike.%${filtros.termo_busca}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar equipes: ${error.message}`);
    }

    return data || [];
  }

  // Buscar equipe por ID
  static async buscarEquipePorId(id: string): Promise<Equipe | null> {
    const { data, error } = await supabase
      .from("equipes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Erro ao buscar equipe: ${error.message}`);
    }

    return data;
  }

  // Buscar equipes ativas (para selects)
  static async buscarEquipesAtivas(): Promise<Equipe[]> {
    const { data, error } = await supabase
      .from("equipes")
      .select("*")
      .eq("status", "ativa")
      .order("nome_equipe", { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar equipes ativas: ${error.message}`);
    }

    return data || [];
  }

  // Criar nova equipe
  static async criarEquipe(equipe: EquipeCreate): Promise<Equipe> {
    const { data, error } = await supabase
      .from("equipes")
      .insert(equipe)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar equipe: ${error.message}`);
    }

    return data;
  }

  // Atualizar equipe
  static async atualizarEquipe(id: string, updates: EquipeUpdate): Promise<Equipe> {
    const { data, error } = await supabase
      .from("equipes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar equipe: ${error.message}`);
    }

    return data;
  }

  // Inativar equipe (soft delete)
  static async inativarEquipe(id: string): Promise<void> {
    const { error } = await supabase
      .from("equipes")
      .update({ status: "inativa" })
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao inativar equipe: ${error.message}`);
    }
  }

  // Ativar equipe
  static async ativarEquipe(id: string): Promise<void> {
    const { error } = await supabase
      .from("equipes")
      .update({ status: "ativa" })
      .eq("id", id);

    if (error) {
      throw new Error(`Erro ao ativar equipe: ${error.message}`);
    }
  }

  // Verificar se equipe pode ser inativada (não tem usuários ativos)
  static async podeInativarEquipe(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("usuarios_internos")
      .select("id")
      .eq("equipe_id", id)
      .eq("status", "ativo")
      .limit(1);

    if (error) {
      throw new Error(`Erro ao verificar usuários da equipe: ${error.message}`);
    }

    return !data || data.length === 0;
  }

  // Obter estatísticas das equipes
  static async obterEstatisticas(): Promise<EstatisticasEquipes> {
    // Buscar estatísticas básicas das equipes
    const { data: equipesData, error: equipesError } = await supabase
      .from("equipes")
      .select("status");

    if (equipesError) {
      throw new Error(`Erro ao buscar estatísticas de equipes: ${equipesError.message}`);
    }

    // Buscar contagem de usuários por equipe
    const { data: usuariosData, error: usuariosError } = await supabase
      .from("usuarios_internos")
      .select("equipe_id")
      .eq("status", "ativo");

    if (usuariosError) {
      throw new Error(`Erro ao buscar usuários por equipe: ${usuariosError.message}`);
    }

    // Buscar nomes das equipes
    const { data: equipesNomes, error: equipesNomesError } = await supabase
      .from("equipes")
      .select("id, nome_equipe");

    if (equipesNomesError) {
      throw new Error(`Erro ao buscar nomes das equipes: ${equipesNomesError.message}`);
    }

    // Processar dados
    const total = equipesData?.length || 0;
    const ativas = equipesData?.filter(e => e.status === "ativa").length || 0;
    const inativas = total - ativas;

    // Contar usuários por equipe
    const usuarios_por_equipe: Record<string, number> = {};
    const equipesMap = new Map(equipesNomes?.map(e => [e.id, e.nome_equipe]) || []);
    
    usuariosData?.forEach((usuario: { equipe_id: string | null }) => {
      if (usuario.equipe_id) {
        const nomeEquipe = equipesMap.get(usuario.equipe_id);
        if (nomeEquipe) {
          usuarios_por_equipe[nomeEquipe] = (usuarios_por_equipe[nomeEquipe] || 0) + 1;
        }
      }
    });

    return {
      total,
      ativas,
      inativas,
      usuarios_por_equipe,
    };
  }
}
