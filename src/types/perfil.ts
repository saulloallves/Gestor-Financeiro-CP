import { z } from "zod";
import { validarTelefone } from "../utils/validations";

// Schema para edição de dados pessoais
export const editarDadosPessoaisSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  telefone: z.string()
    .optional()
    .refine((val) => !val || val.trim() === "" || validarTelefone(val), {
      message: "Telefone deve estar no formato (xx) xxxxx-xxxx ou (xx) xxxx-xxxx"
    }),
});

// Schema para alteração de senha
export const alterarSenhaSchema = z.object({
  senhaAtual: z.string()
    .min(1, "Senha atual é obrigatória"),
  novaSenha: z.string()
    .min(6, "Nova senha deve ter no mínimo 6 caracteres")
    .max(50, "Nova senha deve ter no máximo 50 caracteres"),
  confirmarSenha: z.string()
    .min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: "Confirmação de senha não confere",
  path: ["confirmarSenha"],
});

// Types inferidos dos schemas
export type EditarDadosPessoaisData = z.infer<typeof editarDadosPessoaisSchema>;
export type AlterarSenhaData = z.infer<typeof alterarSenhaSchema>;

// Interface para dados do perfil do usuário
export interface PerfilUsuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  fotoPerfil?: string; // URL da foto no Supabase Storage
  perfil?: string; // Para usuários internos
  tipo?: string; // Para franqueados
  equipe_nome?: string; // Nome da equipe para usuários internos
  dataCriacao?: string;
  ultimoLogin?: string;
}

// Interface para upload de foto
export interface UploadFotoResult {
  url: string;
  path: string;
}

// Interface para o estado do modal de perfil
export interface PerfilModalState {
  isOpen: boolean;
  activeTab: 'dados' | 'senha';
  isLoading: boolean;
  uploadingPhoto: boolean;
}

// Responses das APIs
export interface UpdatePerfilResponse {
  success: boolean;
  message: string;
  data?: PerfilUsuario;
}

export interface UpdateSenhaResponse {
  success: boolean;
  message: string;
}