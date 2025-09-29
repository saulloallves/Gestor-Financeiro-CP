import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("--- [Processamento Manual v2] Função iniciada ---");
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Segurança: Verificar se o usuário está autenticado e é interno
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Cabeçalho de autorização ausente.");
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("[Processamento Manual v2] ERRO: Token de usuário inválido.", userError?.message);
      return new Response(JSON.stringify({ error: 'Acesso não autorizado: token inválido.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: internalUser, error: internalUserError } = await supabaseAdmin
      .from('usuarios_internos')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (internalUserError || !internalUser) {
      console.error(`[Processamento Manual v2] ERRO: Usuário ${user.email} não é um usuário interno.`);
      return new Response(JSON.stringify({ error: 'Acesso não autorizado: permissão negada.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`[Processamento Manual v2] INFO: Autorização OK para ${user.email}.`);

    // 2. Buscar cobranças
    console.log("[Processamento Manual v2] INFO: Buscando cobranças pendentes...");
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
    console.log(`[Processamento Manual v2] INFO: ${cobrancas.length} cobranças encontradas.`);

    // 3. Invocar 'agente-orquestrador' para cada cobrança
    const promises = cobrancas.map(cobranca => 
      supabaseAdmin.functions.invoke('agente-orquestrador', {
        body: { cobranca_id: cobranca.id },
      })
    );

    const results = await Promise.allSettled(promises);
    
    // 4. Processar resultados
    const sucessos = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const falhas = results.length - sucessos;

    const responsePayload = {
      success: falhas === 0,
      total_processadas: cobrancas.length,
      sucessos,
      falhas,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[Processamento Manual v2] ERRO FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});