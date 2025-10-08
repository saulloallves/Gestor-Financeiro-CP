import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
    const { phone, message } = payload;
    if (!phone || !message) {
      throw new Error('Payload inválido do webhook Z-API.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Encontrar o franqueado pelo número de telefone
    const telefoneLimpo = String(phone).replace(/\D/g, '');
    const { data: franqueados, error: franqueadoError } = await supabaseAdmin
      .from('franqueados')
      .select('id')
      .or(`telefone.like.%${telefoneLimpo}%,whatsapp.like.%${telefoneLimpo}%`);
      
    if (franqueadoError || !franqueados || franqueados.length === 0) {
      throw new Error(`Nenhum franqueado encontrado para o número: ${phone}`);
    }
    const franqueado = franqueados[0];

    // 2. Encontrar a negociação ativa mais recente para este franqueado
    const { data: negociacao, error: negociacaoError } = await supabaseAdmin
      .from('negociacoes')
      .select('id')
      .eq('franqueado_id', franqueado.id)
      .eq('status', 'em_andamento')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (negociacaoError || !negociacao) {
      throw new Error(`Nenhuma negociação ativa encontrada para o franqueado ${franqueado.id}`);
    }

    // 3. Invocar o agente negociador para processar a resposta
    const { error: invokeError } = await supabaseAdmin.functions.invoke('agente-negociador', {
      body: {
        negociacao_id: negociacao.id,
        user_message: message,
      },
    });

    if (invokeError) {
      throw new Error(`Erro ao invocar o agente negociador: ${invokeError.message}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Resposta processada." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('[whatsapp-webhook-handler] ERRO:', error.message);
    // Retorna 200 para o Z-API não ficar tentando reenviar, mas loga o erro.
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });
  }
});