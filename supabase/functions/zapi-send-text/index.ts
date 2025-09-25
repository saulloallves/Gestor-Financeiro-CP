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
    const { phone, message, logData } = body;

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "Missing phone or message" }), { status: 400, headers: corsHeaders });
    }

    const instanceId = Deno.env.get("ZAPI_INSTANCE_ID") || "";
    const instanceToken = Deno.env.get("ZAPI_INSTANCE_TOKEN") || "";
    const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN") || "";
    const baseUrl = Deno.env.get("ZAPI_BASE_URL") || "https://api.z-api.io";

    if (!instanceId || !instanceToken || !clientToken) {
      return new Response(JSON.stringify({ error: "Z-API credentials not configured" }), { status: 500, headers: corsHeaders });
    }

    const url = `${baseUrl}/instances/${encodeURIComponent(instanceId)}/token/${encodeURIComponent(instanceToken)}/send-text`;

    const zapiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": clientToken },
      body: JSON.stringify({ phone, message }),
    });

    const zapiData = await zapiRes.json().catch(() => ({}));

    if (!zapiRes.ok) {
      return new Response(JSON.stringify({ error: "Z-API error", status: zapiRes.status, data: zapiData }), { status: 502, headers: corsHeaders });
    }

    // **NOVO: Log de auditoria no sucesso**
    if (logData) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const logEntry = {
        ...logData,
        canal: 'whatsapp',
        conteudo: message,
        status: 'enviado',
        external_id: zapiData?.id,
      };

      const { error: logError } = await supabaseAdmin.from('comunicacoes').insert(logEntry);
      if (logError) {
        console.error('Falha ao registrar log de comunicação:', logError);
        // Não falha a requisição principal, apenas loga o erro
      }
    }

    return new Response(JSON.stringify({ success: true, data: zapiData }), { status: 200, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Unexpected error", message: err instanceof Error ? err.message : String(err) }), { status: 500, headers: corsHeaders });
  }
});