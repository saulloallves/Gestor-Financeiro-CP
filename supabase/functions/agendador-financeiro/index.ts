import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("--- [Agendador v2] Função iniciada ---");
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Agendador v2] ERRO: Acesso não autorizado.");
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log("[Agendador v2] INFO: Buscando cobranças pendentes...");
    const { data: cobrancas, error: cobrancasError } = await supabaseAdmin
      .from('cobrancas')
      .select('id')
      .in('status', ['pendente', 'em_aberto', 'em_atraso', 'vencido'])
      .limit(50);

    if (cobrancasError) throw new Error(`Erro ao buscar cobranças: ${cobrancasError.message}`);
    if (!cobrancas || cobrancas.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Nenhuma cobrança para processar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      });
    }
    console.log(`[Agendador v2] INFO: ${cobrancas.length} cobranças encontradas.`);

    const results = [];
    for (const cobranca of cobrancas) {
      try {
        // 1. Chamar o Orquestrador para obter a decisão
        console.log(`[Agendador v2] -> Invocando Orquestrador para cobrança ${cobranca.id}`);
        const { data: orquestradorData, error: orquestradorError } = await supabaseAdmin.functions.invoke('agente-orquestrador', {
          body: { cobranca_id: cobranca.id },
        });
        if (orquestradorError) throw new Error(`Erro no orquestrador: ${orquestradorError.message}`);
        
        const decision = orquestradorData.decision;
        console.log(`[Agendador v2] Decisão para ${cobranca.id}: ${JSON.stringify(decision)}`);

        // 2. Executar a ação com base na decisão
        let actionResult: any = { status: 'NO_ACTION' };
        switch (decision.action) {
          case 'SEND_WHATSAPP':
            // Esta chamada será implementada no próximo passo. Por enquanto, simulamos.
            console.log(`[Agendador v2] Ação para ${cobranca.id}: Enviar WhatsApp com template ${decision.template_name}`);
            // A chamada real ao agente de notificação virá aqui.
            // Ex: await supabaseAdmin.functions.invoke('agente-notificacao-whatsapp', { body: { cobranca_id: cobranca.id, template_name: decision.template_name } });
            actionResult = { status: 'WHATSAPP_SCHEDULED', template: decision.template_name };
            break;
          
          case 'ESCALAR_JURIDICO':
            console.log(`[Agendador v2] Ação para ${cobranca.id}: Escalar para Jurídico`);
            const { error: updateError } = await supabaseAdmin
              .from('cobrancas')
              .update({ status: 'juridico' })
              .eq('id', cobranca.id);
            if (updateError) throw new Error(`Falha ao escalar para jurídico: ${updateError.message}`);
            actionResult = { status: 'ESCALATED_TO_LEGAL' };
            break;

          case 'NO_ACTION':
            console.log(`[Agendador v2] Ação para ${cobranca.id}: Nenhuma ação necessária.`);
            break;

          default:
            console.warn(`[Agendador v2] Ação desconhecida para ${cobranca.id}: ${decision.action}`);
            actionResult = { status: 'UNKNOWN_ACTION', action: decision.action };
        }
        results.push({ cobranca_id: cobranca.id, success: true, result: actionResult });
      } catch (error) {
        console.error(`[Agendador v2] ERRO ao processar cobrança ${cobranca.id}:`, error.message);
        results.push({ cobranca_id: cobranca.id, success: false, error: error.message });
      }
    }

    const sucessos = results.filter(r => r.success).length;
    const falhas = results.length - sucessos;
    const responsePayload = {
      success: falhas === 0,
      total_processadas: cobrancas.length,
      sucessos,
      falhas,
      detalhes: results,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[Agendador v2] ERRO FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});