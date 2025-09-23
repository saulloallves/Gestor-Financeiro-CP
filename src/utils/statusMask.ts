/**
 * Utilitários para conversão de status das unidades
 * Converte os valores do banco para labels amigáveis ao usuário
 */

import type { StatusUnidade } from "../types/unidades";

/**
 * Mapeia os status do banco para labels amigáveis
 */
export const STATUS_LABELS: Record<StatusUnidade, string> = {
  "OPERAÇÃO": "Operação",
  "IMPLANTAÇÃO": "Implantação",
  "SUSPENSO": "Suspenso",
  "CANCELADO": "Cancelado",
} as const;

/**
 * Converte um status do banco para o label amigável
 * @param status Status do banco de dados
 * @returns Label amigável para exibição
 */
export function getStatusLabel(status: StatusUnidade): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Mapeia cores para cada status (para uso com Chips e indicadores)
 */
export const STATUS_COLORS = {
  "OPERAÇÃO": "success",
  "IMPLANTAÇÃO": "warning",
  "SUSPENSO": "info",
  "CANCELADO": "error",
} as const;

/**
 * Obtém a cor apropriada para um status
 * @param status Status da unidade
 * @returns Cor do tema do Material-UI
 */
export function getStatusColor(status: StatusUnidade) {
  return STATUS_COLORS[status] || "default";
}
