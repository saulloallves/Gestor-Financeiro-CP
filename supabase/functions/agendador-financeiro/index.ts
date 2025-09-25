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
    // 1. Segurança: Verificar se a chamada veio do Cron Job
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Criar cliente Supabase com permissões de admin para buscar cobranças
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Buscar cobranças que precisam de atenção
    const { data: cobrancas, error: cobrancasError } = await supabaseAdmin
      .from('cobrancas')
      .select('id')
      .in('status', ['pendente', 'em_aberto', 'em_atraso', 'vencido'])
      .limit(50);

    if (cobrancasError) {
      throw new Error(`Erro ao buscar cobranças: ${cobrancasError.message}`);
    }

    if (!cobrancas || cobrancas.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Nenhuma cobrança para processar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Invocar a função 'agente-financeiro' para cada cobrança em paralelo
    const promises = cobrancas.map(cobranca => 
      supabaseAdmin.functions.invoke('agente-financeiro', {
        body: { cobranca_id: cobranca.id },
      })
    );

    const results = await Promise.allSettled(promises);

    // 5. Processar os resultados
    const sucessos = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const falhas = results.filter(r => r.status === 'rejected' || r.value.error);

    const detalhesFalhas = falhas.map((f, index) => {
      const cobrancaId = cobrancas[index].id;
      if (f.status === 'rejected') {
        return `Cobrança ${cobrancaId}: ${f.reason.message}`;
      }
      // @ts-ignore
      return `Cobrança ${cobrancaId}: ${f.value.error.message}`;
    });

    const responsePayload = {
      success: falhas.length === 0,
      total_processadas: cobrancas.length,
      sucessos,
      falhas: falhas.length,
      detalhes_falhas: detalhesFalhas,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});