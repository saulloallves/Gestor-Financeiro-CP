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
  ai_agent_id?: string;
  notion_page_id?: string;
  phone?: string;
  email?: string;
  operation_mon?: string;
  operation_tue?: string;
  operation_wed?: string;
  operation_thu?: string;
  operation_fri?: string;
  operation_sat?: string;
  operation_sun?: string;
  operation_hol?: string;
  drive_folder_id?: string;
  drive_folder_link?: string;
  docs_folder_id?: string;
  docs_folder_link?: string;
  store_model: string;
  store_phase: string;
  store_imp_phase: string;
  address?: string;
  number_address?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  uf?: string;
  postal_code?: string;
  instagram_profile?: string;
  has_parking?: boolean;
  parking_spots?: number;
  has_partner_parking?: boolean;
  partner_parking_address?: string;
  purchases_active?: boolean;
  sales_active?: boolean;
  cnpj?: string;
  created_at: string;
  updated_at: string;
}

// Views do banco matriz
export interface VFranqueadosComUnidades {
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
  created_at?: string;
  updated_at?: string;
  unidade_ids: string[];
  total_unidades: number;
}

export interface VFranqueadosUnidadesDetalhes extends VFranqueadosComUnidades {
  unidade_group_codes: number[];
  unidade_group_names: string[];
}

// Tipos mapeados para compatibilidade com o sistema atual
export interface FranqueadoMapeado {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco: string;
  nacionalidade?: string;
  data_nascimento?: string;
  tipo_proprietario: string;
  esta_em_contrato?: boolean;
  recebe_prolabore?: boolean;
  valor_prolabore?: number;
  disponibilidade?: string;
  tem_outras_atividades?: boolean;
  descricao_outras_atividades?: string;
  imagem_perfil?: string;
  foi_indicado?: boolean;
  nome_indicador?: string;
  codigo_unidade_indicador?: string;
  fonte_descoberta?: string;
  educacao?: string;
  foi_empreendedor?: boolean;
  profissao_anterior?: string;
  faixa_salarial_anterior?: string;
  termo_lgpd_aceito: boolean;
  termo_confidencialidade_aceito: boolean;
  termo_sistema_aceito: boolean;
  senha_web: string;
  unidades_ids?: string[];
  total_unidades?: number;
  unidades_codigos?: number[];
  unidades_nomes?: string[];
  created_at?: string;
  updated_at?: string;
  
  // Campos obrigatórios do tipo Franqueado para compatibilidade
  tipo: 'principal' | 'familiar' | 'investidor' | 'parceiro';
  contrato_social: boolean;
  empreendedor_previo: boolean;
  status: 'ativo' | 'inativo';
}

export interface UnidadeMapeada {
  id: string;
  codigo_unidade: string;
  nome_padrao: string;
  nome_grupo: string;
  telefone?: string;
  email?: string;
  endereco_completo?: string;
  modelo_loja: string;
  fase_loja: string;
  fase_implantacao: string;
  instagram?: string;
  tem_estacionamento?: boolean;
  vagas_estacionamento?: number;
  tem_estacionamento_parceiro?: boolean;
  endereco_estacionamento_parceiro?: string;
  compras_ativo?: boolean;
  vendas_ativo?: boolean;
  cnpj?: string;
  horario_segunda?: string;
  horario_terca?: string;
  horario_quarta?: string;
  horario_quinta?: string;
  horario_sexta?: string;
  horario_sabado?: string;
  horario_domingo?: string;
  horario_feriado?: string;
  created_at: string;
  updated_at: string;
  
  // Campos obrigatórios do tipo Unidade para compatibilidade
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
  horario_seg_sex?: string;
  status: 'OPERAÇÃO' | 'IMPLANTAÇÃO' | 'SUSPENSO' | 'CANCELADO';
  multifranqueado: boolean;
  franqueado_principal_id?: string;
}

// Filtros
export interface FranqueadoMatrizFilter {
  owner_type?: string;
  is_in_contract?: boolean;
  receives_prolabore?: boolean;
  has_other_activities?: boolean;
  was_referred?: boolean;
  was_entrepreneur?: boolean;
  search?: string;
}

export interface UnidadeMatrizFilter {
  store_model?: string;
  store_phase?: string;
  city?: string;
  state?: string;
  uf?: string;
  has_parking?: boolean;
  purchases_active?: boolean;
  sales_active?: boolean;
  search?: string;
}