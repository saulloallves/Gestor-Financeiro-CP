import { z } from "zod";
import { validarTelefone } from "../utils/validations";

// ==============================================
// SCHEMAS DE VALIDAÇÃO PARA EQUIPES
// ==============================================

export const equipeSchema = z.object({
  nome_equipe: z
    .string()
    .min(2, "Nome da equipe deve ter no mínimo 2 caracteres")
    .max(50, "Nome da equipe deve ter no máximo 50 caracteres"),
  descricao: z
    .string()
    .max(255, "Descrição deve ter no máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ativa", "inativa"]),
});

export const equipeUpdateSchema = equipeSchema.partial();

// ==============================================
// SCHEMAS DE VALIDAÇÃO PARA USUÁRIOS INTERNOS
// ==============================================

export const usuarioInternoSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z
    .string()
    .optional()
    .refine(
      (telefone) => {
        if (!telefone || telefone.trim() === "") return true;
        return validarTelefone(telefone);
      },
      {
        message: "Telefone inválido",
      }
    )
    .or(z.literal("")),
  perfil: z.enum(["operador", "gestor", "juridico", "admin"]),
  equipe_id: z.string().uuid("ID da equipe inválido"),
  status: z.enum(["ativo", "inativo"]),
});

export const usuarioInternoUpdateSchema = usuarioInternoSchema.partial();

// ==============================================
// TYPES PARA EQUIPES
// ==============================================

export interface Equipe {
  id: string;
  nome_equipe: string;
  descricao?: string;
  status: "ativa" | "inativa";
  created_at: string;
  updated_at: string;
}

export interface EquipeCreate {
  nome_equipe: string;
  descricao?: string;
  status?: "ativa" | "inativa";
}

export interface EquipeUpdate {
  nome_equipe?: string;
  descricao?: string;
  status?: "ativa" | "inativa";
}

// ==============================================
// TYPES PARA USUÁRIOS INTERNOS (ATUALIZADO)
// ==============================================

export type PerfilUsuario = "operador" | "gestor" | "juridico" | "admin";
export type StatusUsuario = "ativo" | "inativo";

export interface UsuarioInterno {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  perfil: PerfilUsuario;
  equipe_id?: string;
  status: StatusUsuario;
  ultimo_login?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  foto_perfil?: string;
  
  // Campos de controle de primeiro acesso
  primeiro_acesso?: boolean;
  senha_temporaria?: boolean;
  data_criacao?: string;
  data_ultima_senha?: string;
  
  // Relacionamentos
  equipe?: Equipe;
}

export interface UsuarioInternoCreate {
  nome: string;
  email: string;
  telefone?: string;
  perfil: PerfilUsuario;
  equipe_id: string;
  status?: StatusUsuario;
  senha?: string; // Para criação de conta no auth
}

export interface UsuarioInternoUpdate {
  nome?: string;
  email?: string;
  telefone?: string;
  perfil?: PerfilUsuario;
  equipe_id?: string;
  status?: StatusUsuario;
}

// ==============================================
// TYPES PARA CONTROLE DE PRIMEIRO ACESSO
// ==============================================

export interface TrocarSenhaPrimeiroAcesso {
  nova_senha: string;
  confirmar_senha: string;
}

export interface ResultadoTrocaSenha {
  success: boolean;
  error?: string;
  message?: string;
}

// ==============================================
// TYPES PARA LISTAGENS E FILTROS
// ==============================================

export interface UsuarioInternoListItem extends UsuarioInterno {
  equipe_nome?: string;
}

export interface FiltrosUsuarios {
  equipe_id?: string;
  perfil?: PerfilUsuario;
  status?: StatusUsuario;
  termo_busca?: string;
}

export interface FiltrosEquipes {
  status?: "ativa" | "inativa";
  termo_busca?: string;
}

// ==============================================
// TYPES PARA ESTATÍSTICAS
// ==============================================

export interface EstatisticasUsuarios {
  total: number;
  ativos: number;
  inativos: number;
  por_perfil: Record<PerfilUsuario, number>;
  por_equipe: Record<string, number>;
}

export interface EstatisticasEquipes {
  total: number;
  ativas: number;
  inativas: number;
  usuarios_por_equipe: Record<string, number>;
}

// ==============================================
// TYPES PARA VALIDAÇÃO
// ==============================================

export type EquipeFormData = z.infer<typeof equipeSchema>;
export type EquipeUpdateFormData = z.infer<typeof equipeUpdateSchema>;
export type UsuarioInternoFormData = z.infer<typeof usuarioInternoSchema>;
export type UsuarioInternoUpdateFormData = z.infer<typeof usuarioInternoUpdateSchema>;
