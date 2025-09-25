import type { 
  FranqueadoMatriz, 
  UnidadeMatriz, 
  VFranqueadosUnidadesDetalhes,
  FranqueadoMapeado, 
  UnidadeMapeada 
} from '../types/matriz';

/**
 * Mapeia status da unidade do banco matriz para o tipo do sistema
 */
function mapearStatusUnidade(storePhase: string): 'OPERAÇÃO' | 'IMPLANTAÇÃO' | 'SUSPENSO' | 'CANCELADO' {
  switch (storePhase.toLowerCase()) {
    case 'operacao':
    case 'operação':
    case 'ativo':
    case 'funcionando':
      return 'OPERAÇÃO';
    case 'implantacao':
    case 'implantação':
    case 'instalacao':
    case 'instalação':
      return 'IMPLANTAÇÃO';
    case 'suspenso':
    case 'pausado':
    case 'inativo':
      return 'SUSPENSO';
    case 'cancelado':
    case 'encerrado':
    case 'fechado':
      return 'CANCELADO';
    default:
      return 'IMPLANTAÇÃO'; // Default
  }
}

/**
 * Mapeia tipo de proprietário do banco matriz para o tipo do sistema
 */
function mapearTipoProprietario(ownerType: string): 'principal' | 'familiar' | 'investidor' | 'parceiro' {
  switch (ownerType.toLowerCase()) {
    case 'principal':
      return 'principal';
    case 'sócio':
    case 'socio':
    case 'familiar':
      return 'familiar';
    case 'investidor':
      return 'investidor';
    case 'parceiro':
      return 'parceiro';
    default:
      return 'principal'; // Default
  }
}

/**
 * Mapeia um franqueado do banco matriz para o formato esperado pelo sistema
 */
export function mapearFranqueadoMatriz(franqueado: FranqueadoMatriz | VFranqueadosUnidadesDetalhes): FranqueadoMapeado {
  return {
    id: franqueado.id,
    nome: franqueado.full_name,
    cpf: franqueado.cpf_rnm || '',
    email: franqueado.email || extrairEmailDoContato(franqueado.contact),
    telefone: extrairTelefoneDoContato(franqueado.contact),
    tipo: mapearTipoProprietario(franqueado.owner_type),
    status: franqueado.is_active_system ? 'ativo' : 'inativo',
    created_at: franqueado.created_at,
    updated_at: franqueado.updated_at,
    // Campos adicionais para compatibilidade
    nome_completo: franqueado.full_name,
    nacionalidade: franqueado.nationality,
    data_nascimento: franqueado.birth_date,
    endereco_rua: franqueado.address,
    endereco_numero: franqueado.number_address,
    endereco_complemento: franqueado.address_complement,
    endereco_bairro: franqueado.neighborhood,
    endereco_cidade: franqueado.city,
    endereco_estado: franqueado.state,
    endereco_uf: franqueado.uf,
    endereco_cep: franqueado.postal_code,
    whatsapp: extrairTelefoneDoContato(franqueado.contact),
    email_pessoal: franqueado.email || extrairEmailDoContato(franqueado.contact),
    prolabore: franqueado.prolabore_value,
    contrato_social: franqueado.is_in_contract || false,
    disponibilidade: (franqueado.availability?.toLowerCase() as any) || 'integral',
    profissao_anterior: franqueado.previous_profession,
    empreendedor_previo: franqueado.was_entrepreneur || false,
  };
}

/**
 * Mapeia uma unidade do banco matriz para o formato esperado pelo sistema
 */
export function mapearUnidadeMatriz(unidade: UnidadeMatriz): UnidadeMapeada {
  return {
    id: unidade.id,
    codigo_unidade: String(unidade.group_code),
    nome_padrao: unidade.group_name,
    cnpj: unidade.cnpj,
    status: mapearStatusUnidade(unidade.store_phase),
    telefone_comercial: unidade.phone,
    email_comercial: unidade.email,
    endereco_rua: unidade.address,
    endereco_numero: unidade.number_address,
    endereco_complemento: unidade.address_complement,
    endereco_bairro: unidade.neighborhood,
    endereco_cidade: unidade.city,
    endereco_estado: unidade.state,
    endereco_uf: unidade.uf,
    endereco_cep: unidade.postal_code,
    created_at: unidade.created_at,
    updated_at: unidade.updated_at,
  };
}

/**
 * Extrai o email do campo contact (que pode conter email e telefone)
 */
function extrairEmailDoContato(contact: string): string {
  if (!contact) return '';
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = contact.match(emailRegex);
  return match ? match[0] : '';
}

/**
 * Extrai o telefone do campo contact (que pode conter email e telefone)
 */
function extrairTelefoneDoContato(contact: string): string {
  if (!contact) return '';
  const semEmail = contact.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '');
  const telefoneRegex = /[\d()-\s+]+/;
  const match = semEmail.match(telefoneRegex);
  if (match) {
    return match[0].replace(/[^\d+]/g, '');
  }
  return '';
}