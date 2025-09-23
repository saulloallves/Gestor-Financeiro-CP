/**
 * Funções utilitárias para validação de documentos brasileiros
 * Seguindo as diretrizes do projeto para centralizar validações
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function limparNumeros(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Formata CNPJ para exibição (12.345.678/0001-90)
 */
export function formatarCnpj(cnpj: string): string {
  const cnpjLimpo = limparNumeros(cnpj);

  if (cnpjLimpo.length !== 14) {
    return cnpj; // Retorna original se não tiver 14 dígitos
  }

  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Valida se um CNPJ é válido usando o algoritmo oficial
 */
export function validarCnpj(cnpj: string): boolean {
  const cnpjLimpo = limparNumeros(cnpj);

  // Verificar se tem 14 dígitos
  if (cnpjLimpo.length !== 14) {
    return false;
  }

  // Verificar se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) {
    return false;
  }

  // Calcular primeiro dígito verificador
  let soma = 0;
  let peso = 5;

  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }

  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  // Verificar primeiro dígito
  if (parseInt(cnpjLimpo[12]) !== digito1) {
    return false;
  }

  // Calcular segundo dígito verificador
  soma = 0;
  peso = 6;

  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo[i]) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }

  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  // Verificar segundo dígito
  return parseInt(cnpjLimpo[13]) === digito2;
}

/**
 * Formata CPF para exibição (123.456.789-00)
 */
export function formatarCpf(cpf: string): string {
  const cpfLimpo = limparNumeros(cpf);

  if (cpfLimpo.length !== 11) {
    return cpf; // Retorna original se não tiver 11 dígitos
  }

  return cpfLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Valida se um CPF é válido usando o algoritmo oficial
 */
export function validarCpf(cpf: string): boolean {
  const cpfLimpo = limparNumeros(cpf);

  // Verificar se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }

  // Verificar se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }

  // Calcular primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo[i]) * (10 - i);
  }

  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  // Verificar primeiro dígito
  if (parseInt(cpfLimpo[9]) !== digito1) {
    return false;
  }

  // Calcular segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo[i]) * (11 - i);
  }

  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  // Verificar segundo dígito
  return parseInt(cpfLimpo[10]) === digito2;
}

/**
 * Formata telefone brasileiro (11) 99999-9999 ou (11) 9999-9999
 */
export function formatarTelefone(telefone: string): string {
  const telefoneLimpo = limparNumeros(telefone);

  if (telefoneLimpo.length === 11) {
    // Celular: (11) 99999-9999
    return telefoneLimpo.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  } else if (telefoneLimpo.length === 10) {
    // Fixo: (11) 9999-9999
    return telefoneLimpo.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  return telefone; // Retorna original se não estiver no formato esperado
}

/**
 * Valida se um telefone brasileiro é válido
 */
export function validarTelefone(telefone: string): boolean {
  const telefoneLimpo = limparNumeros(telefone);

  // Deve ter 10 (fixo) ou 11 (celular) dígitos
  if (telefoneLimpo.length !== 10 && telefoneLimpo.length !== 11) {
    return false;
  }

  // Verificar se o DDD é válido (11-99)
  const ddd = parseInt(telefoneLimpo.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }

  // Para celular (11 dígitos), o terceiro dígito deve ser 9
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo[2] === "9";
  }

  return true;
}

/**
 * Valida se um código de unidade é válido (4 dígitos)
 * Seguindo o padrão da Cresci e Perdi
 */
export function validarCodigoUnidade(codigo: string): boolean {
  const codigoLimpo = limparNumeros(codigo);

  // Deve ter exatamente 4 dígitos
  if (codigoLimpo.length !== 4) {
    return false;
  }

  // Deve estar na faixa 0000-9999
  const numerocodigo = parseInt(codigoLimpo);
  return numerocodigo >= 0 && numerocodigo <= 9999;
}

/**
 * Formata código de unidade para exibição (mantém 4 dígitos com zeros à esquerda)
 */
export function formatarCodigoUnidade(codigo: string): string {
  const codigoLimpo = limparNumeros(codigo);

  if (codigoLimpo.length === 0) {
    return codigo;
  }

  // Garantir que tenha no máximo 4 dígitos
  const codigoTruncado = codigoLimpo.substring(0, 4);

  // Adicionar zeros à esquerda se necessário
  return codigoTruncado.padStart(4, "0");
}

/**
 * Regex patterns para validação
 */
export const REGEX_PATTERNS = {
  // CNPJ: aceita com ou sem formatação
  CNPJ: /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/,

  // CPF: aceita com ou sem formatação
  CPF: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,

  // CEP: aceita com ou sem formatação
  CEP: /^\d{5}-?\d{3}$/,

  // Telefone: aceita vários formatos
  TELEFONE: /^(\(?\d{2}\)?\s?)?(\d{4,5})-?\d{4}$/,

  // Email básico
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Código de unidade: exatamente 4 dígitos
  CODIGO_UNIDADE: /^\d{4}$/,

  // Apenas números
  APENAS_NUMEROS: /^\d+$/,

  // Apenas letras (com acentos)
  APENAS_LETRAS: /^[a-zA-ZÀ-ÿ\s]+$/,
} as const;
