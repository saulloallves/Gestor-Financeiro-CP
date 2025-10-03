import { z } from 'zod';
import type { PerfilUsuario } from './equipes';

// Schema de validação para o formulário de permissão
export const permissaoSchema = z.object({
  recurso: z.string().min(3, 'O nome do recurso é obrigatório.'),
  perfil: z.enum(['operador', 'gestor', 'juridico', 'admin']).optional().nullable(),
  equipe_id: z.string().uuid().optional().nullable(),
  permitido: z.boolean(),
}).superRefine((data, ctx) => {
  if (!data.perfil && !data.equipe_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'É obrigatório selecionar um Perfil ou uma Equipe.',
      path: ['perfil'],
    });
  }
});

export type PermissaoFormData = z.infer<typeof permissaoSchema>;

// Interface para a entidade Permissão
export interface Permissao {
  id: number;
  perfil: PerfilUsuario | null;
  equipe_id: string | null;
  recurso: string;
  permitido: boolean;
  created_at: string;
  // Campos de join
  equipes?: {
    nome_equipe: string;
  };
}