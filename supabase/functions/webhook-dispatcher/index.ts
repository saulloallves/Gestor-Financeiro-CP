import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, payload } = await req.json();

    if (!topic || !payload) {
      throw new Error('Payload inválido: topic e payload são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // A lógica principal do dispatcher é simplesmente transmitir o evento
    // para um canal de Realtime, onde os clientes podem ouvir.
    const channel = supabaseAdmin.channel('matriz-updates');
    const status = await channel.send({
      type: 'broadcast',
      event: topic,
      payload: payload,
    });

    if (status !== 'ok') {
      console.error(`[webhook-dispatcher] Erro ao transmitir evento para o canal: ${status}`);
    }

    return new Response(JSON.stringify({ success: true, message: `Evento para o tópico '${topic}' despachado.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[webhook-dispatcher] Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});