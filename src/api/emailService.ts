import { supabase } from './supabaseClient';

export type SendEmailPayload = {
  to: string | string[]; // email(s) destinatário(s)
  subject: string; // assunto do email
  html?: string; // conteúdo HTML
  text?: string; // conteúdo texto plano (alternativo ao HTML)
  from?: string; // email remetente (opcional, usa default)
  fromName?: string; // nome do remetente (opcional, usa default)
};

export type SendEmailResponse = {
  success: boolean;
  messageId?: string;
  data?: unknown;
  error?: string;
  status?: number;
};

type SupabaseFnError = { message: string; name?: string; status?: number };

export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResponse> {
  const { data, error } = await supabase.functions.invoke('brevo-send-email', {
    body: payload,
  });

  if (error) {
    const e = error as SupabaseFnError;
    return { success: false, error: e.message, status: e.status };
  }
  
  return { success: true, messageId: data?.messageId, data };
}

// Helper para envios comuns do sistema
export async function sendSystemEmail(
  to: string | string[],
  subject: string,
  htmlContent: string,
  textContent?: string
): Promise<SendEmailResponse> {
  return sendEmail({
    to,
    subject,
    html: htmlContent,
    text: textContent,
  });
}

// Helper para emails de notificação
export async function sendNotificationEmail(
  to: string | string[],
  title: string,
  message: string
): Promise<SendEmailResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${title}</h2>
      <p style="color: #666; line-height: 1.6;">${message}</p>
      <hr style="margin: 20px 0; border: 1px solid #eee;">
      <p style="font-size: 12px; color: #999;">
        Este é um email automático do Sistema Cresci e Perdi. Não responda a este email.
      </p>
    </div>
  `;
  
  const text = `${title}\n\n${message}\n\n---\nEste é um email automático do Sistema Cresci e Perdi. Não responda a este email.`;
  
  return sendEmail({
    to,
    subject: title,
    html,
    text,
  });
}
