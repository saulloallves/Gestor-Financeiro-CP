// Tipos para o módulo de Unidades - Cresci e Perdi
// Baseado na especificação do módulo 2.1

export type StatusUnidade = 'ativo' | 'em_implantacao' | 'suspenso' | 'cancelado';

export interface Unidade {
  id: string;
  codigo_unidade: string;
  nome_grupo?: string;
  nome_padrao: string;
  cnpj?: string;
  
  // Contato da unidade
  telefone_comercial?: string;
  email_comercial?: string;
  instagram?: string;
  
  // Endereço completo
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  endereco?: string; // Campo legado, pode ser removido futuramente
  
  // Horários de funcionamento
  horario_seg_sex?: string;
  horario_sabado?: string;
  horario_domingo?: string;
  
  // Status e configurações
  status: StatusUnidade;
  multifranqueado: boolean;
  
  // Relacionamentos
  franqueado_principal_id?: string;
  
  // Metadados
  created_at: string;
  updated_at: string;
}

// Tipo para criação de unidade (sem campos auto-gerados)
export interface CreateUnidadeData {
  nome_grupo?: string;
  nome_padrao: string;
  cnpj?: string;
  codigo_unidade?: string; // Código opcional que pode ser fornecido pelo usuário
  
  // Contato da unidade
  telefone_comercial?: string;
  email_comercial?: string;
  instagram?: string;
  
  // Endereço completo
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  
  // Horários de funcionamento
  horario_seg_sex?: string;
  horario_sabado?: string;
  horario_domingo?: string;
  
  // Status e configurações
  status?: StatusUnidade;
  multifranqueado?: boolean;
  
  // Relacionamentos
  franqueado_principal_id?: string;
}

// Tipo para edição de unidade
export interface UpdateUnidadeData extends Partial<CreateUnidadeData> {
  id: string;
}

// Tipo para filtros na listagem
export interface UnidadeFilter {
  status?: StatusUnidade[];
  cidade?: string;
  uf?: string;
  multifranqueado?: boolean;
  codigo_unidade?: string;
  nome_padrao?: string;
  franqueado_principal_id?: string;
}

// Tipo para ordenação
export interface UnidadeSort {
  field: keyof Unidade;
  direction: 'asc' | 'desc';
}

// Tipo para busca e paginação
export interface UnidadePagination {
  page: number;
  limit: number;
  total?: number;
}

// Response type para listagem com paginação
export interface UnidadeListResponse {
  data: Unidade[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipo para dados do franqueado principal (usado no formulário)
export interface FranqueadoPrincipal {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  tipo: string;
}

// Dados para o formulário de unidade (inclui franqueado)
export interface UnidadeFormData extends CreateUnidadeData {
  franqueado_principal?: FranqueadoPrincipal;
}

// Log de auditoria para unidades
export interface UnidadeAuditLog {
  id: string;
  unidade_id: string;
  usuario_id: string;
  acao: 'create' | 'update' | 'delete' | 'status_change';
  dados_anteriores?: Partial<Unidade>;
  dados_novos?: Partial<Unidade>;
  observacoes?: string;
  created_at: string;
}

// Estados do formulário
export interface UnidadeFormState {
  data: UnidadeFormData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Props para componentes
export interface UnidadeListProps {
  filters?: UnidadeFilter;
  onFilterChange?: (filters: UnidadeFilter) => void;
  onUnidadeSelect?: (unidade: Unidade) => void;
}

export interface UnidadeFormProps {
  unidade?: Unidade;
  onSubmit: (data: CreateUnidadeData | UpdateUnidadeData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface UnidadeCardProps {
  unidade: Unidade;
  onEdit?: (unidade: Unidade) => void;
  onView?: (unidade: Unidade) => void;
  onStatusChange?: (unidade: Unidade, newStatus: StatusUnidade) => void;
  showActions?: boolean;
}

// Tipo para franqueados vinculados a uma unidade
export interface FranqueadoVinculado {
  id: string;
  franqueado_id: string;
  unidade_id: string;
  data_vinculo: string;
  ativo: boolean;
  franqueado: {
    id: string;
    nome: string;
    cpf: string;
    telefone?: string;
    email?: string;
    tipo: string;
    status: string;
  };
}
