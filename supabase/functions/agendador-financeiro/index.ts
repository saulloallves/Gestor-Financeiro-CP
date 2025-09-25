import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("--- [Agendador] Função iniciada ---");
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Segurança
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Agendador] ERRO: Acesso não autorizado.");
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log("[Agendador] INFO: Autorização OK.");

    // 2. Conexão com Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("[Agendador] INFO: Cliente Supabase Admin criado.");

    // 3. Buscar cobranças
    console.log("[Agendador] INFO: Buscando cobranças pendentes...");
    const { data: cobrancas, error: cobrancasError } = await supabaseAdmin
      .from('cobrancas')
      .select('id')
      .in('status', ['pendente', 'em_aberto', 'em_atraso', 'vencido'])
      .limit(50);

    if (cobrancasError) {
      console.error("[Agendador] ERRO ao buscar cobranças:", cobrancasError);
      throw new Error(`Erro ao buscar cobranças: ${cobrancasError.message}`);
    }

    if (!cobrancas || cobrancas.length === 0) {
      console.log("[Agendador] INFO: Nenhuma cobrança para processar.");
      return new Response(JSON.stringify({ success: true, message: 'Nenhuma cobrança para processar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    console.log(`[Agendador] INFO: ${cobrancas.length} cobranças encontradas para processar.`);

    // 4. Invocar 'agente-financeiro'
    console.log("[Agendador] INFO: Invocando 'agente-financeiro' para cada cobrança...");
    const promises = cobrancas.map(cobranca => {
      console.log(`[Agendador] -> Invocando para cobrança ID: ${cobranca.id}`);
      return supabaseAdmin.functions.invoke('agente-financeiro', {
        body: { cobranca_id: cobranca.id },
      });
    });

    const results = await Promise.allSettled(promises);
    console.log("[Agendador] INFO: Todas as invocações foram concluídas. Processando resultados...");
    console.log("[Agendador] DEBUG: Resultados brutos:", JSON.stringify(results, null, 2));

    // 5. Processar resultados
    const sucessos = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const falhas = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));

    const detalhesFalhas = falhas.map((f, index) => {
      const cobrancaId = cobrancas[index].id;
      if (f.status === 'rejected') {
        return `Cobrança ${cobrancaId}: ${f.reason.message || 'Rejeitada sem motivo'}`;
      }
      // @ts-ignore
      const errorBody = f.value.data?.error || f.value.error || 'Erro desconhecido na função agente';
      return `Cobrança ${cobrancaId}: ${JSON.stringify(errorBody)}`;
    });

    const responsePayload = {
      success: falhas.length === 0,
      total_processadas: cobrancas.length,
      sucessos,
      falhas: falhas.length,
      detalhes_falhas: detalhesFalhas,
    };
    console.log("[Agendador] INFO: Resumo do processamento:", responsePayload);

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[Agendador] ERRO FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});