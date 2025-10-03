import { z } from "zod";

// Schema de validação para login interno
export const loginInternoSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  lembrarMe: z.boolean().optional(),
});

// Schema de validação para login franqueado (agora usa email em vez de código)
export const loginFranqueadoSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Alternativa: Schema para login por código de unidade
export const loginUnidadeSchema = z.object({
  codigoUnidade: z
    .string()
    .min(3, "Código da unidade deve ter no mínimo 3 caracteres"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Types para os dados de login
export type LoginInternoData = z.infer<typeof loginInternoSchema>;
export type LoginFranqueadoData = z.infer<typeof loginFranqueadoSchema>;
export type LoginUnidadeData = z.infer<typeof loginUnidadeSchema>;

// Types para o usuário logado
export interface UsuarioInterno {
  id: string;
  user_id?: string; // ID do auth.users para funcionalidades de primeiro acesso
  nome: string;
  email: string;
  telefone?: string;
  perfil?: "operador" | "gestor" | "juridico" | "admin";
  equipe_id?: string;
  status: "ativo" | "inativo";
  ultimo_login?: string;
  permissoes?: string[]; // Array com os recursos permitidos
  
  // Campos de controle de primeiro acesso
  primeiro_acesso?: boolean;
  senha_temporaria?: boolean;
  data_criacao?: string;
  data_ultima_senha?: string;
}

export interface UnidadeVinculada {
  id: string;
  codigo: string;
  nome: string;
  status: string;
}

export interface UsuarioFranqueado {
  id: string;
  nome: string;
  email: string;
  tipo: "franqueado" | "gestor" | "investidor";
  unidades: UnidadeVinculada[];
}

// Type união para qualquer usuário
export type Usuario = UsuarioInterno | UsuarioFranqueado;

// Type para o estado de autenticação
export interface AuthState {
  usuario: Usuario | null;
  tipoAcesso: "interno" | "franqueado" | null;
  isLoading: boolean;
  login: (
    dados: LoginInternoData | LoginFranqueadoData | LoginUnidadeData,
    tipo: "interno" | "franqueado" | "unidade"
  ) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}