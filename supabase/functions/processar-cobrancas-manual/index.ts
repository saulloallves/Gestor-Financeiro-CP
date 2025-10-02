import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("--- [Processamento Manual v3] Função iniciada ---");
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
      console.error("[Processamento Manual v3] ERRO: Token de usuário inválido.", userError?.message);
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
      console.error(`[Processamento Manual v3] ERRO: Usuário ${user.email} não é um usuário interno.`);
      return new Response(JSON.stringify({ error: 'Acesso não autorizado: permissão negada.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`[Processamento Manual v3] INFO: Autorização OK para ${user.email}.`);

    // 2. Buscar cobranças
    console.log("[Processamento Manual v3] INFO: Buscando cobranças pendentes...");
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
    console.log(`[Processamento Manual v3] INFO: ${cobrancas.length} cobranças encontradas.`);

    // 3. Processar cada cobrança individualmente
    const results = [];
    for (const cobranca of cobrancas) {
      try {
        // 3.1. Chamar o Orquestrador para obter a decisão
        console.log(`[Processamento Manual v3] -> Invocando Orquestrador para cobrança ${cobranca.id}`);
        const { data: orquestradorData, error: orquestradorError } = await supabaseAdmin.functions.invoke('agente-orquestrador', {
          body: { cobranca_id: cobranca.id },
        });
        if (orquestradorError) throw new Error(`Erro no orquestrador: ${orquestradorError.message}`);
        
        const decision = orquestradorData.decision;
        console.log(`[Processamento Manual v3] Decisão para ${cobranca.id}: ${JSON.stringify(decision)}`);

        // 3.2. Executar a ação com base na decisão
        let actionResult: any = { status: 'NO_ACTION' };
        if (decision && decision.action && decision.action !== 'NO_ACTION') {
            let functionToInvoke = '';
            switch (decision.action) {
              case 'SEND_WHATSAPP':
                functionToInvoke = 'agente-notificacao-whatsapp';
                break;
              // Adicionar outros casos aqui no futuro (ex: SEND_EMAIL)
              default:
                throw new Error(`Ação desconhecida recebida do orquestrador: ${decision.action}`);
            }

            console.log(`[Processamento Manual v3] Ação para ${cobranca.id}: Invocando agente ${functionToInvoke} com template ${decision.template_name}`);
            const { data: actionData, error: actionError } = await supabaseAdmin.functions.invoke(functionToInvoke, {
              body: { cobranca_id: cobranca.id, template_name: decision.template_name },
            });
            if (actionError) throw new Error(`Erro no agente de ação: ${actionError.message}`);
            actionResult = { status: 'ACTION_EXECUTED', action: decision.action, result: actionData };
        } else {
            console.log(`[Processamento Manual v3] Ação para ${cobranca.id}: Nenhuma ação necessária.`);
        }
        results.push({ cobranca_id: cobranca.id, success: true, result: actionResult });
      } catch (error) {
        console.error(`[Processamento Manual v3] ERRO ao processar cobrança ${cobranca.id}:`, error.message);
        results.push({ cobranca_id: cobranca.id, success: false, error: error.message });
      }
    }

    // 4. Processar resultados
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
    console.error("[Processamento Manual v3] ERRO FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});