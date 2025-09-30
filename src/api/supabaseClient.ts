import { createClient } from "@supabase/supabase-js";
// import type { Database } from '../types/supabase-generated' // Tipos gerados automaticamente

// Pega as variáveis de ambiente que definimos no .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Cria e exporta o cliente Supabase para uso no frontend (com RLS)
// O <Database> é para a tipagem automática do Supabase com nosso schema real
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cria e exporta um cliente "admin" para uso em contextos de backend (ex: Edge Functions, scripts)
// Este cliente bypassa o RLS, então use com cuidado.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
