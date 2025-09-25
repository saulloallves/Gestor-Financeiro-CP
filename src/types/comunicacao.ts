import { z } from 'zod';

// Tipos para Templates
export type CanalComunicacao = 'whatsapp' | 'email';

export const templateSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  canal: z.enum(['whatsapp', 'email']),
  conteudo: z.string().min(10, 'O conteúdo deve ter pelo menos 10 caracteres.'),
  ativo: z.boolean().default(true),
});

export type TemplateFormData = z.infer<typeof templateSchema>;

export interface Template extends TemplateFormData {
  id: string;
  criado_por: string;
  data_criacao: string;
  updated_at: string;
}

// Tipos para Comunicações (Logs)
export type TipoMensagem = 'automatica' | 'manual' | 'recebida';
export type StatusComunicacao = 'enviado' | 'entregue' | 'lido' | 'erro' | 'recebido';

export interface Comunicacao {
  id: string;
  unidade_id: string;
  franqueado_id: string;
  canal: CanalComunicacao;
  tipo_mensagem: TipoMensagem;
  template_id?: string;
  conteudo: string;
  status: StatusComunicacao;
  data_envio: string;
  enviado_por?: string; // 'ia_agente_financeiro' ou nome do usuário
  enviado_por_usuario_id?: string;
  enviado_por_ia: boolean;
}