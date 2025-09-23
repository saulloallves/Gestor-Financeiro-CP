// Tipos para as tabelas do Supabase Database
// Estes tipos serão gerados automaticamente pelo Supabase CLI no futuro
// Por enquanto, definimos manualmente baseado na nossa estrutura

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      usuarios_internos: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone?: string | null;
          perfil: "operador" | "gestor" | "juridico" | "admin";
          equipe_id?: string | null;
          status: "ativo" | "inativo";
          ultimo_login?: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone?: string | null;
          perfil: "operador" | "gestor" | "juridico" | "admin";
          equipe_id: string;
          status?: "ativo" | "inativo";
          ultimo_login?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string | null;
          perfil?: "operador" | "gestor" | "juridico" | "admin";
          equipe_id?: string | null;
          status?: "ativo" | "inativo";
          ultimo_login?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      franqueados: {
        Row: {
          id: string;
          nome: string;
          codigo_franquia: string;
          nome_fantasia: string;
          user_id: string; // Referência ao auth.users
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          codigo_franquia: string;
          nome_fantasia: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          codigo_franquia?: string;
          nome_fantasia?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
  perfil_usuario_enum: "operador" | "gestor" | "juridico" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Tipos auxiliares para facilitar o uso
export type UsuarioInterno =
  Database["public"]["Tables"]["usuarios_internos"]["Row"];
export type Franqueado = Database["public"]["Tables"]["franqueados"]["Row"];
export type NovoUsuarioInterno =
  Database["public"]["Tables"]["usuarios_internos"]["Insert"];
export type NovoFranqueado =
  Database["public"]["Tables"]["franqueados"]["Insert"];

// Tipos para respostas de autenticação
export interface SupabaseAuthResponse {
  user: {
    id: string;
    email?: string;
    user_metadata?: Json;
    app_metadata?: Json;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  };
}
