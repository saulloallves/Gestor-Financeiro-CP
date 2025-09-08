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

// Helper para envio de credenciais de usuários
export async function sendCredentialsEmail(
  to: string,
  nome: string,
  email: string,
  senha: string
): Promise<SendEmailResponse> {
  const htmlContent = `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #F4F6F8;">
      <div style="background-color: #ffffff; border-radius: 12px; padding: 40px 30px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        
        <!-- Header com Logo -->
        <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #FFC31A;">
          <img src="https://raw.githubusercontent.com/saulloallves/Gestor-Financeiro-CP/main/src/assets/logo-principal.png" 
               alt="Cresci e Perdi" 
               style="max-width: 200px; height: auto; margin-bottom: 15px;" />
          <h1 style="color: #FFC31A; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Bem-vindo(a) ao Sistema!
          </h1>
        </div>
        
        <!-- Conteúdo Principal -->
        <div style="margin-bottom: 30px;">
          <p style="color: #212121; font-size: 16px; line-height: 1.6; margin: 0;">
            Olá <strong style="color: #E3A024;">${nome}</strong>,
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 15px 0;">
            Sua conta foi criada com sucesso no <strong style="color: #FFC31A;">Sistema Financeiro Cresci e Perdi</strong>! 
            Abaixo estão suas credenciais de acesso:
          </p>
        </div>

        <!-- Box de Credenciais -->
        <div style="background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CC 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border: 2px solid #FFC31A; box-shadow: 0 4px 8px rgba(255, 195, 26, 0.2);">
          <h3 style="color: #E3A024; margin: 0 0 20px 0; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
            <span style="margin-right: 12px; font-size: 24px;">🔐</span>
            Suas Credenciais
          </h3>
          <div style="background: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #FFC31A;">
            <p style="margin: 12px 0; color: #212121; display: flex; align-items: center;">
              <strong style="color: #E3A024; margin-right: 8px;">📧 Email:</strong> 
              <span style="font-family: 'Courier New', monospace; background-color: #F4F6F8; padding: 6px 12px; border-radius: 6px; border: 1px solid #FFC31A; color: #212121; font-weight: 600;">${email}</span>
            </p>
            <p style="margin: 12px 0; color: #212121; display: flex; align-items: center;">
              <strong style="color: #E3A024; margin-right: 8px;">🔐 Senha:</strong> 
              <span style="font-family: 'Courier New', monospace; background-color: #F4F6F8; padding: 6px 12px; border-radius: 6px; border: 1px solid #FFC31A; color: #212121; font-weight: 700; font-size: 16px;">${senha}</span>
            </p>
          </div>
        </div>

        <!-- Avisos Importantes -->
        <div style="background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 5px solid #F9A825;">
          <h4 style="color: #E65100; margin: 0 0 15px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
            <span style="margin-right: 10px; font-size: 22px;">⚠️</span>
            Informações Importantes
          </h4>
          <ul style="color: #E65100; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>Senha temporária:</strong> Recomendamos alterá-la no primeiro acesso por segurança.</li>
            <li><strong>Confidencialidade:</strong> Guarde estas credenciais em local seguro.</li>
            <li><strong>Privacidade:</strong> Não compartilhe sua senha com terceiros.</li>
            <li><strong>Suporte:</strong> Em caso de dúvidas, entre em contato com a equipe.</li>
          </ul>
        </div>

        <!-- Botão de Acesso -->
        <div style="text-align: center; margin: 40px 0 30px 0;">
          <a href="https://cobranca.girabot.com.br/" 
             style="display: inline-block; 
                    background: linear-gradient(135deg, #FFC31A 0%, #E3A024 100%); 
                    color: #212121; 
                    padding: 16px 40px; 
                    text-decoration: none; 
                    border-radius: 12px; 
                    font-weight: 700; 
                    font-size: 18px;
                    box-shadow: 0 4px 12px rgba(255, 195, 26, 0.4);
                    border: 2px solid #E3A024;
                    transition: all 0.3s ease;">
            🚀 Acessar Sistema Agora
          </a>
        </div>

        <!-- Rodapé -->
        <hr style="margin: 30px 0; border: none; border-top: 2px solid #FFC31A; opacity: 0.3;">
        
        <div style="text-align: center; background: #F4F6F8; padding: 20px; border-radius: 8px;">
          <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
            Este é um email automático do <strong style="color: #E3A024;">Sistema Financeiro Cresci e Perdi</strong>.<br>
            Não responda a este email. Para suporte, entre em contato através dos canais oficiais.
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
            © 2025 Cresci e Perdi - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  `;

  const textContent = `
🦒 CRESCI E PERDI - Sistema Financeiro
=======================================

Bem-vindo(a) ao Sistema!

Olá ${nome},

Sua conta foi criada com sucesso no Sistema Financeiro Cresci e Perdi! 
Abaixo estão suas credenciais de acesso:

📧 EMAIL: ${email}
🔐 SENHA TEMPORÁRIA: ${senha}

⚠️ INFORMAÇÕES IMPORTANTES:
• Senha temporária: Recomendamos alterá-la no primeiro acesso por segurança
• Confidencialidade: Guarde estas credenciais em local seguro
• Privacidade: Não compartilhe sua senha com terceiros
• Suporte: Em caso de dúvidas, entre em contato com a equipe

🚀 ACESSE O SISTEMA:
https://cobranca.girabot.com.br/

=======================================
Este é um email automático do Sistema Financeiro Cresci e Perdi.
Não responda a este email. Para suporte, entre em contato através dos canais oficiais.

© 2025 Cresci e Perdi - Todos os direitos reservados
  `;

  return sendEmail({
    to,
    subject: '🔐 Suas credenciais de acesso - Sistema Cresci e Perdi',
    html: htmlContent,
    text: textContent,
  });
}
