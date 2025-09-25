// Tipos específicos para as tabelas do banco matriz
// Baseado no schema fornecido

export interface FranqueadoMatriz {
  id: string;
  full_name: string;
  nationality?: string;
  cpf_rnm: string;
  birth_date?: string;
  address?: string;
  owner_type: string;
  is_in_contract: boolean;
  receives_prolabore?: boolean;
  prolabore_value?: number;
  availability?: string;
  has_other_activities?: boolean;
  other_activities_description?: string;
  contact: string;
  profile_image?: string;
  was_referred?: boolean;
  referrer_name?: string;
  referrer_unit_code?: string;
  discovery_source?: string;
  education?: string;
  was_entrepreneur?: boolean;
  previous_profession?: string;
  previous_salary_range?: string;
  lgpd_term_accepted: boolean;
  confidentiality_term_accepted: boolean;
  system_term_accepted: boolean;
  created_at?: string;
  updated_at?: string;
  systems_password: number;
  is_active_system: boolean;
  number_address?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  uf?: string;
  postal_code?: string;
  instagram?: string;
  email?: string;
}

export interface UnidadeMatriz {
  id: string;
  group_name: string;
  group_code: number;
  phone?: string;
  email?: string;
  store_phase: string;
  address?: string;
  number_address?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  uf?: string;
  postal_code?: string;
  cnpj?: string;
  created_at: string;
  updated_at: string;
}

// Views do banco matriz
export interface VFranqueadosUnidadesDetalhes extends FranqueadoMatriz {
  unidade_ids: string[];
  total_unidades: number;
  unidade_group_codes: number[];
  unidade_group_names: string[];
}

// Tipos mapeados para compatibilidade com o sistema atual
export interface FranqueadoMapeado {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  tipo: 'principal' | 'familiar' | 'investidor' | 'parceiro';
  status: 'ativo' | 'inativo';
  created_at?: string;
  updated_at?: string;
  nome_completo?: string;
  nacionalidade?: string;
  data_nascimento?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  whatsapp?: string;
  email_pessoal?: string;
  prolabore?: number | null;
  contrato_social: boolean;
  disponibilidade: 'integral' | 'parcial' | 'eventos';
  profissao_anterior?: string;
  empreendedor_previo: boolean;
}

export interface UnidadeMapeada {
  id: string;
  codigo_unidade: string;
  nome_padrao: string;
  cnpj?: string;
  status: 'OPERAÇÃO' | 'IMPLANTAÇÃO' | 'SUSPENSO' | 'CANCELADO';
  telefone_comercial?: string;
  email_comercial?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  created_at: string;
  updated_at: string;
}