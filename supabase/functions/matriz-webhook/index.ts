import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { table, record } = payload;

    if (!table || !record) {
      throw new Error('Payload inválido: table e record são obrigatórios.');
    }

    // Usa as variáveis de ambiente do Supabase para criar um cliente com permissões de admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Cria um canal Realtime para transmitir a atualização
    const channel = supabaseAdmin.channel('matriz-updates');

    // Envia a mensagem para todos os clientes que estão ouvindo este canal
    const status = await channel.send({
      type: 'broadcast',
      event: 'matriz-update',
      payload: {
        type: table, // 'unidades' ou 'franqueados'
        record: record,
      },
    });

    console.log(`[matriz-webhook] Mensagem enviada para o canal 'matriz-updates'`, { status, table, recordId: record.id });

    return new Response(JSON.stringify({ success: true, status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[matriz-webhook] Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});