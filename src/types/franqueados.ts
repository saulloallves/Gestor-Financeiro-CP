// Tipos para o módulo de Franqueados - Cresci e Perdi
// Baseado na especificação do módulo 2.2

export type TipoFranqueado =
  | "principal"
  | "familiar"
  | "investidor"
  | "parceiro";
export type DisponibilidadeFranqueado = "integral" | "parcial" | "eventos";

export interface Franqueado {
  id: string;

  // Dados Pessoais
  nome: string;
  nome_completo?: string; // Campo adicional para nome completo
  cpf: string;
  nacionalidade?: string;
  data_nascimento?: string;

  // Endereço
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string; // Campo adicional
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_uf?: string;
  endereco_cep?: string;

  // Contatos
  telefone?: string;
  whatsapp?: string;
  email_pessoal?: string;
  email_comercial?: string;
  email?: string; // Campo calculado para busca

  // Informações Contratuais
  tipo: TipoFranqueado;
  prolabore?: number | null;
  contrato_social: boolean;
  disponibilidade: DisponibilidadeFranqueado;

  // Histórico Profissional
  profissao_anterior?: string;
  empreendedor_previo: boolean;

  // Status e Metadados
  is_active_system: boolean; // Alterado de 'status' para 'is_active_system'
  user_id?: string; // Referência ao auth.users para login
  asaas_customer_id?: string; // ID do cliente no sistema ASAAS
  created_at: string;
  updated_at: string;

  // Relacionamentos (populados via join)
  unidades_vinculadas?: UnidadeVinculada[];
}

export interface UnidadeVinculada {
  id: string;
  codigo_unidade: string;
  nome_padrao: string;
  status: string;
  data_vinculo: string;
  ativo: boolean;
  franqueado_principal: boolean;
}

// Tipo para criação de franqueado (sem campos auto-gerados)
export interface CreateFranqueadoData {
  nome: string;
  cpf: string;
  nacionalidade?: string;
  data_nascimento?: string;

  // Endereço
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_uf?: string;
  endereco_cep?: string;

  // Contatos
  telefone?: string;
  whatsapp?: string;
  email_pessoal: string; // Obrigatório para criação de login
  email_comercial?: string;

  // Informações Contratuais
  tipo: TipoFranqueado;
  prolabore?: number | null;
  contrato_social?: boolean;
  disponibilidade: DisponibilidadeFranqueado;

  // Histórico Profissional
  profissao_anterior?: string;
  empreendedor_previo?: boolean;

  // Status
  is_active_system?: boolean; // Alterado de 'status'

  // Vínculos com unidades
  unidades_vinculadas?: string[]; // Array de IDs de unidades
}

// Tipo para edição de franqueado
export interface UpdateFranqueadoData extends Partial<CreateFranqueadoData> {
  id: string;
}

// Tipo para filtros na listagem
export interface FranqueadoFilter {
  is_active_system?: boolean; // Alterado de 'status'
  tipo?: TipoFranqueado[];
  cidade?: string;
  estado?: string;
  nome?: string;
  cpf?: string;
  unidade_id?: string;
  contrato_social?: boolean;
  empreendedor_previo?: boolean;
  updated_at_gte?: string;
}

// Tipo para ordenação
export interface FranqueadoSort {
  field: keyof Franqueado;
  direction: "asc" | "desc";
}

// Tipo para busca e paginação
export interface FranqueadoPagination {
  page: number;
  limit: number;
  total?: number;
}

// Response type para listagem com paginação
export interface FranqueadoListResponse {
  data: Franqueado[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dados para o formulário de franqueado
export interface FranqueadoFormData extends CreateFranqueadoData {
  unidades_selecionadas?: UnidadeVinculada[];
}

// Log de auditoria para franqueados
export interface FranqueadoAuditLog {
  id: string;
  franqueado_id: string;
  usuario_id: string;
  acao: "create" | "update" | "delete" | "status_change" | "vinculo_change";
  dados_anteriores?: Partial<Franqueado>;
  dados_novos?: Partial<Franqueado>;
  observacoes?: string;
  created_at: string;
}

// Estados do formulário
export interface FranqueadoFormState {
  data: FranqueadoFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Props para componentes
export interface FranqueadoListProps {
  filters?: FranqueadoFilter;
  onFilterChange?: (filters: FranqueadoFilter) => void;
  onFranqueadoSelect?: (franqueado: Franqueado) => void;
}

export interface FranqueadoFormProps {
  franqueado?: Franqueado;
  onSubmit: (
    data: CreateFranqueadoData | UpdateFranqueadoData
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface FranqueadoCardProps {
  franqueado: Franqueado;
  onEdit?: (franqueado: Franqueado) => void;
  onView?: (franqueado: Franqueado) => void;
  onStatusChange?: (
    franqueado: Franqueado,
    newStatus: boolean
  ) => void;
  showActions?: boolean;
}

// Dados para seleção de unidades
export interface UnidadeParaVinculo {
  id: string;
  codigo_unidade: string;
  nome_padrao: string;
  status: string;
  franqueado_principal_id?: string;
  franqueado_principal_nome?: string;
}

// Dados para relatórios
export interface FranqueadoRelatório {
  total_franqueados: number;
  por_tipo: Record<TipoFranqueado, number>;
  por_status: Record<'ativo' | 'inativo', number>; // Mantido para compatibilidade de relatório
  por_estado: { estado: string; count: number }[];
  com_prolabore: number;
  empreendedores_previos: number;
  multifranqueados: number;
}