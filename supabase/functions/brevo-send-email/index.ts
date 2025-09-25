// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  } as const;

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, html, text, from, fromName, logData } = body;

    if (!to || !subject || (!html && !text)) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const defaultFrom = Deno.env.get("BREVO_DEFAULT_FROM") || "noreply@crescieperdi.com.br";
    const defaultFromName = Deno.env.get("BREVO_DEFAULT_FROM_NAME") || "Sistema Cresci e Perdi";

    if (!brevoApiKey) {
      return new Response(JSON.stringify({ error: "Brevo API key not configured" }), { status: 500, headers: corsHeaders });
    }

    const brevoPayload = {
      sender: { name: fromName || defaultFromName, email: from || defaultFrom },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      subject: subject,
      htmlContent: html,
      textContent: text,
    };

    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "accept": "application/json", "api-key": brevoApiKey, "content-type": "application/json" },
      body: JSON.stringify(brevoPayload),
    });

    const brevoData = await brevoResponse.json().catch(() => ({}));

    if (!brevoResponse.ok) {
      return new Response(JSON.stringify({ error: "Brevo API error", data: brevoData }), { status: 502, headers: corsHeaders });
    }

    // **NOVO: Log de auditoria no sucesso**
    if (logData) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const logEntry = {
        ...logData,
        canal: 'email',
        conteudo: html || text,
        status: 'enviado',
        external_id: brevoData?.messageId,
      };

      const { error: logError } = await supabaseAdmin.from('comunicacoes').insert(logEntry);
      if (logError) {
        console.error('Falha ao registrar log de comunicação:', logError);
      }
    }

    return new Response(JSON.stringify({ success: true, data: brevoData }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error", message: err instanceof Error ? err.message : String(err) }), { status: 500, headers: corsHeaders });
  }
});