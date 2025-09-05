/**
 * Utilitários para conversão de status e tipos dos franqueados
 * Converte os valores do banco para labels amigáveis ao usuário
 */

import type {
  StatusFranqueado,
  TipoFranqueado,
  DisponibilidadeFranqueado,
} from "../types/franqueados";

/**
 * Mapeia os tipos de franqueado para labels amigáveis
 */
export const TIPO_FRANQUEADO_LABELS: Record<TipoFranqueado, string> = {
  principal: "Principal",
  familiar: "Sócio Familiar",
  investidor: "Investidor",
  parceiro: "Parceiro",
} as const;

/**
 * Converte um tipo de franqueado para o label amigável
 */
export function getTipoFranqueadoLabel(tipo: TipoFranqueado): string {
  return TIPO_FRANQUEADO_LABELS[tipo] || tipo;
}

/**
 * Mapeia cores para cada tipo de franqueado
 */
export const TIPO_FRANQUEADO_COLORS = {
  principal: "primary",
  familiar: "secondary",
  investidor: "info",
  parceiro: "warning",
} as const;

/**
 * Obtém a cor apropriada para um tipo de franqueado
 */
export function getTipoFranqueadoColor(tipo: TipoFranqueado) {
  return TIPO_FRANQUEADO_COLORS[tipo] || "default";
}

/**
 * Mapeia os status do franqueado para labels amigáveis
 */
export const STATUS_FRANQUEADO_LABELS: Record<StatusFranqueado, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
} as const;

/**
 * Converte um status do franqueado para o label amigável
 */
export function getStatusFranqueadoLabel(status: StatusFranqueado): string {
  return STATUS_FRANQUEADO_LABELS[status] || status;
}

/**
 * Mapeia cores para cada status de franqueado
 */
export const STATUS_FRANQUEADO_COLORS = {
  ativo: "success",
  inativo: "error",
} as const;

/**
 * Obtém a cor apropriada para um status de franqueado
 */
export function getStatusFranqueadoColor(status: StatusFranqueado) {
  return STATUS_FRANQUEADO_COLORS[status] || "default";
}

/**
 * Mapeia a disponibilidade do franqueado para labels amigáveis
 */
export const DISPONIBILIDADE_LABELS: Record<DisponibilidadeFranqueado, string> =
  {
    integral: "Integral",
    parcial: "Parcial",
    eventos: "Apenas Eventos",
  } as const;

/**
 * Converte uma disponibilidade para o label amigável
 */
export function getDisponibilidadeLabel(
  disponibilidade: DisponibilidadeFranqueado
): string {
  return DISPONIBILIDADE_LABELS[disponibilidade] || disponibilidade;
}

/**
 * Mapeia cores para cada disponibilidade
 */
export const DISPONIBILIDADE_COLORS = {
  integral: "success",
  parcial: "warning",
  eventos: "info",
} as const;

/**
 * Obtém a cor apropriada para uma disponibilidade
 */
export function getDisponibilidadeColor(
  disponibilidade: DisponibilidadeFranqueado
) {
  return DISPONIBILIDADE_COLORS[disponibilidade] || "default";
}

/**
 * Formata valor de pró-labore para exibição
 */
export function formatarProlabore(valor?: number): string {
  if (!valor) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

/**
 * Formata lista de unidades vinculadas para exibição
 */
export function formatarUnidadesVinculadas(
  unidades?: Array<{ codigo_unidade: string; nome_padrao: string }>
): string {
  if (!unidades || unidades.length === 0) return "Nenhuma unidade vinculada";

  if (unidades.length === 1) {
    return `${unidades[0].codigo_unidade} - ${unidades[0].nome_padrao}`;
  }

  return `${unidades.length} unidades vinculadas`;
}

/**
 * Obtém ícone apropriado para tipo de franqueado
 */
export function getTipoFranqueadoIcon(tipo: TipoFranqueado): string {
  const icons = {
    principal: "👑",
    familiar: "👨‍👩‍👧‍👦",
    investidor: "💰",
    parceiro: "🤝",
  };

  return icons[tipo] || "👤";
}

/**
 * Obtém ícone apropriado para disponibilidade
 */
export function getDisponibilidadeIcon(
  disponibilidade: DisponibilidadeFranqueado
): string {
  const icons = {
    integral: "🕐",
    parcial: "⏰",
    eventos: "📅",
  };

  return icons[disponibilidade] || "⏱️";
}
