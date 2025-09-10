import { createClient } from "@supabase/supabase-js";
import type { Database } from '../types/supabase';

const supabaseMatrizUrl = import.meta.env.VITE_SUPABASE_MATRIZ_URL;
const supabaseMatrizAnonKey = import.meta.env.VITE_SUPABASE_MATRIZ_ANON_KEY;

if (!supabaseMatrizUrl || !supabaseMatrizAnonKey) {
  throw new Error('Variáveis do Supabase Matriz não configuradas. Verifique VITE_SUPABASE_MATRIZ_URL e VITE_SUPABASE_MATRIZ_ANON_KEY no arquivo .env');
}

export const supabaseMatriz = createClient<Database>(
  supabaseMatrizUrl,
  supabaseMatrizAnonKey
);
