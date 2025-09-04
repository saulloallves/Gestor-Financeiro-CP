import { createClient } from '@supabase/supabase-js'
// import type { Database } from '../types/supabase-generated' // Tipos gerados automaticamente

// Pega as variáveis de ambiente que definimos no .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cria e exporta o cliente Supabase
// O <Database> é para a tipagem automática do Supabase com nosso schema real
export const supabase = createClient(supabaseUrl, supabaseAnonKey)