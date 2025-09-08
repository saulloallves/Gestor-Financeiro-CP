// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), { status: 415, headers: corsHeaders });
    }

    const body = await req.json();
    const { to, subject, html, text, from, fromName } = body;

    // Validações básicas
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, and (html or text)" }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // Buscar chave da API do Brevo
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const defaultFrom = Deno.env.get("BREVO_DEFAULT_FROM") || "noreply@crescieperdi.com.br";
    const defaultFromName = Deno.env.get("BREVO_DEFAULT_FROM_NAME") || "Sistema Cresci e Perdi";

    if (!brevoApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Brevo API key not configured",
          missing: { BREVO_API_KEY: true }
        }), 
        { status: 500, headers: corsHeaders }
      );
    }

    // Preparar payload para Brevo
    const brevoPayload = {
      sender: {
        name: fromName || defaultFromName,
        email: from || defaultFrom,
      },
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      subject: subject,
      htmlContent: html,
      textContent: text,
    };

    // Enviar para Brevo
    const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(brevoPayload),
    });

    const brevoData = await brevoResponse.json().catch(() => ({}));

    if (!brevoResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: "Brevo API error", 
          status: brevoResponse.status, 
          data: brevoData 
        }), 
        { status: 502, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: brevoData.messageId,
        data: brevoData 
      }), 
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: "Unexpected error", 
        message: err instanceof Error ? err.message : String(err) 
      }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
