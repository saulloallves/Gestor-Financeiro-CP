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
  // Montar endereço completo com os novos campos
  const enderecoCompleto = [
    franqueado.address,
    franqueado.number_address ? `nº ${franqueado.number_address}` : '',
    franqueado.address_complement,
    franqueado.neighborhood,
    franqueado.city,
    franqueado.state || franqueado.uf,
    franqueado.postal_code
  ].filter(Boolean).join(', ');
  
  return {
    id: franqueado.id,
    nome: franqueado.full_name,
    email: franqueado.email || extrairEmailDoContato(franqueado.contact),
    telefone: extrairTelefoneDoContato(franqueado.contact),
    cpf: franqueado.cpf_rnm || '',
    endereco: enderecoCompleto,
    nacionalidade: franqueado.nationality,
    data_nascimento: franqueado.birth_date,
    tipo_proprietario: franqueado.owner_type,
    esta_em_contrato: franqueado.is_in_contract,
    recebe_prolabore: franqueado.receives_prolabore,
    valor_prolabore: franqueado.prolabore_value,
    disponibilidade: franqueado.availability,
    tem_outras_atividades: franqueado.has_other_activities,
    descricao_outras_atividades: franqueado.other_activities_description,
    imagem_perfil: franqueado.profile_image,
    foi_indicado: franqueado.was_referred,
    nome_indicador: franqueado.referrer_name,
    codigo_unidade_indicador: franqueado.referrer_unit_code,
    fonte_descoberta: franqueado.discovery_source,
    educacao: franqueado.education,
    foi_empreendedor: franqueado.was_entrepreneur,
    profissao_anterior: franqueado.previous_profession,
    faixa_salarial_anterior: franqueado.previous_salary_range,
    termo_lgpd_aceito: franqueado.lgpd_term_accepted,
    termo_confidencialidade_aceito: franqueado.confidentiality_term_accepted,
    termo_sistema_aceito: franqueado.system_term_accepted,
    senha_web: ('systems_password' in franqueado) ? franqueado.systems_password.toString() : '',
    created_at: franqueado.created_at,
    updated_at: franqueado.updated_at,
    
    // Campos obrigatórios para compatibilidade com tipo Franqueado
    tipo: mapearTipoProprietario(franqueado.owner_type),
    contrato_social: franqueado.is_in_contract || false,
    empreendedor_previo: franqueado.was_entrepreneur || false,
    status: 'ativo' as const,
    
    // Campos específicos das views
    ...(('unidade_ids' in franqueado) && {
      unidades_ids: franqueado.unidade_ids,
      total_unidades: franqueado.total_unidades,
    }),
    
    ...(('unidade_group_codes' in franqueado) && {
      unidades_codigos: franqueado.unidade_group_codes,
      unidades_nomes: franqueado.unidade_group_names,
    }),
  };
}

/**
 * Mapeia uma unidade do banco matriz para o formato esperado pelo sistema
 */
export function mapearUnidadeMatriz(unidade: UnidadeMatriz): UnidadeMapeada {
  const enderecoCompleto = montarEnderecoCompleto(unidade);
  
  return {
    id: unidade.id,
    codigo_unidade: unidade.group_code.toString(),
    nome_padrao: unidade.group_name,
    nome_grupo: unidade.group_name,
    telefone: unidade.phone,
    email: unidade.email,
    endereco_completo: enderecoCompleto,
    endereco: unidade.address,
    numero: unidade.number_address,
    complemento: unidade.address_complement,
    bairro: unidade.neighborhood,
    cidade: unidade.city,
    estado: unidade.state,
    uf: unidade.uf,
    cep: unidade.postal_code,
    modelo_loja: unidade.store_model,
    fase_loja: unidade.store_phase,
    fase_implantacao: unidade.store_imp_phase,
    instagram: unidade.instagram_profile,
    tem_estacionamento: unidade.has_parking,
    vagas_estacionamento: unidade.parking_spots,
    tem_estacionamento_parceiro: unidade.has_partner_parking,
    endereco_estacionamento_parceiro: unidade.partner_parking_address,
    compras_ativo: unidade.purchases_active,
    vendas_ativo: unidade.sales_active,
    cnpj: unidade.cnpj,
    horario_segunda: unidade.operation_mon,
    horario_terca: unidade.operation_tue,
    horario_quarta: unidade.operation_wed,
    horario_quinta: unidade.operation_thu,
    horario_sexta: unidade.operation_fri,
    horario_sabado: unidade.operation_sat,
    horario_domingo: unidade.operation_sun,
    horario_feriado: unidade.operation_hol,
    created_at: unidade.created_at,
    updated_at: unidade.updated_at,
    
    // Campos obrigatórios para compatibilidade com tipo Unidade
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
    horario_seg_sex: `${unidade.operation_mon || ''} - ${unidade.operation_fri || ''}`,
    status: mapearStatusUnidade(unidade.store_phase),
    multifranqueado: false, // Default, pode ser ajustado baseado em lógica específica
    franqueado_principal_id: undefined, // Será populado via relacionamento se necessário
  };
}

/**
 * Extrai o email do campo contact (que pode conter email e telefone)
 */
function extrairEmailDoContato(contact: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = contact.match(emailRegex);
  return match ? match[0] : '';
}

/**
 * Extrai o telefone do campo contact (que pode conter email e telefone)
 */
function extrairTelefoneDoContato(contact: string): string {
  // Remove email primeiro
  const semEmail = contact.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '');
  
  // Extrai números (telefone)
  const telefoneRegex = /[\d()-\s+]+/;
  const match = semEmail.match(telefoneRegex);
  
  if (match) {
    // Remove caracteres não numéricos except +
    return match[0].replace(/[^\d+]/g, '');
  }
  
  return '';
}

/**
 * Monta o endereço completo a partir dos campos separados
 */
function montarEnderecoCompleto(unidade: UnidadeMatriz): string {
  const partes = [
    unidade.address,
    unidade.number_address && `nº ${unidade.number_address}`,
    unidade.address_complement,
    unidade.neighborhood,
    unidade.city,
    unidade.uf,
    unidade.postal_code && `CEP: ${unidade.postal_code}`
  ].filter(Boolean);
  
  return partes.join(', ');
}

/**
 * Converte filtros do sistema para filtros do banco matriz (franqueados)
 */
export function mapearFiltrosFranqueado(filtros: Record<string, unknown>): Record<string, unknown> {
  const filtrosMapeados: Record<string, unknown> = {};
  
  // Mapear busca por nome
  if (filtros.search) {
    filtrosMapeados.search = filtros.search;
  }
  
  if (filtros.nome) {
    filtrosMapeados.search = filtros.nome;
  }
  
  // Mapear tipo de franqueado
  if (filtros.tipo) {
    // Converter de volta para o formato do banco
    const tiposMap: Record<string, string> = {
      'principal': 'Principal',
      'familiar': 'Sócio',
      'investidor': 'Investidor',
      'parceiro': 'Parceiro'
    };
    
    if (Array.isArray(filtros.tipo)) {
      filtrosMapeados.owner_type = filtros.tipo.map(t => tiposMap[t] || t);
    } else {
      filtrosMapeados.owner_type = tiposMap[filtros.tipo as string] || filtros.tipo;
    }
  }
  
  if (filtros.tipo_proprietario) {
    filtrosMapeados.owner_type = filtros.tipo_proprietario;
  }
  
  if (filtros.esta_em_contrato !== undefined) {
    filtrosMapeados.is_in_contract = filtros.esta_em_contrato;
  }
  
  if (filtros.recebe_prolabore !== undefined) {
    filtrosMapeados.receives_prolabore = filtros.recebe_prolabore;
  }
  
  return filtrosMapeados;
}

/**
 * Converte filtros do sistema para filtros do banco matriz (unidades)
 */
export function mapearFiltrosUnidade(filtros: Record<string, unknown>): Record<string, unknown> {
  const filtrosMapeados: Record<string, unknown> = {};
  
  if (filtros.search) {
    filtrosMapeados.search = filtros.search;
  }
  
  if (filtros.modelo_loja) {
    filtrosMapeados.store_model = filtros.modelo_loja;
  }
  
  if (filtros.fase_loja) {
    filtrosMapeados.store_phase = filtros.fase_loja;
  }
  
  if (filtros.cidade) {
    filtrosMapeados.city = filtros.cidade;
  }
  
  if (filtros.estado) {
    filtrosMapeados.state = filtros.estado;
  }
  
  if (filtros.uf) {
    filtrosMapeados.uf = filtros.uf;
  }
  
  return filtrosMapeados;
}
