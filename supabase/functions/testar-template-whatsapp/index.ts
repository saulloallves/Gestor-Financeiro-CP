import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

serve(async (req) => {
  console.log("--- [Testar Template] Função iniciada ---");
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Segurança (reutilizando o CRON_SECRET para simplicidade)
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Testar Template] ERRO: Acesso não autorizado.");
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log("[Testar Template] INFO: Autorização OK.");

    // 2. Obter parâmetros do corpo da requisição
    const { cobranca_id, template_name, phone_number } = await req.json();
    if (!cobranca_id || !template_name) {
      throw new Error('`cobranca_id` e `template_name` são obrigatórios.');
    }
    
    const targetPhone = phone_number || '5511981996294'; // Usa o número fornecido ou o seu como padrão
    console.log(`[Testar Template] INFO: Parâmetros recebidos: cobranca_id=${cobranca_id}, template_name=${template_name}, phone=${targetPhone}`);

    // 3. Conexão com Supabase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("[Testar Template] INFO: Cliente Supabase Admin criado.");

    // 4. Buscar dados necessários
    console.log("[Testar Template] INFO: Buscando dados da cobrança e template...");
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas')
      .select('*')
      .eq('id', cobranca_id)
      .single();
    if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);

    const { data: template, error: templateError } = await supabaseAdmin
      .from('templates')
      .select('conteudo')
      .eq('nome', template_name)
      .single();
    if (templateError) throw new Error(`Template '${template_name}' não encontrado: ${templateError.message}`);
    
    console.log("[Testar Template] INFO: Dados da cobrança e template carregados com sucesso.");

    // 5. Simular dados do franqueado e unidade (como no agente principal)
    const unidadeInfo = {
        codigo_unidade: cobranca.codigo_unidade,
        nome_padrao: `Unidade ${cobranca.codigo_unidade}`
    };
    const franqueadoInfo = {
        nome: `Franqueado Teste (Unidade ${cobranca.codigo_unidade})`,
    };

    // 6. Preencher o template com as variáveis
    console.log("[Testar Template] INFO: Preenchendo template...");
    const message = template.conteudo
      .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueadoInfo.nome)
      .replace(new RegExp('{{unidade.codigo_unidade}}', 'g'), String(unidadeInfo.codigo_unidade))
      .replace(new RegExp('{{cobranca.valor_atualizado}}', 'g'), cobranca.valor_atualizado.toFixed(2).replace('.', ','))
      .replace(new RegExp('{{cobranca.vencimento}}', 'g'), formatDate(cobranca.vencimento))
      .replace(new RegExp('{{cobranca.link_pagamento}}', 'g'), cobranca.link_pagamento || 'https://crescieperdi.com.br');
    
    console.log("[Testar Template] INFO: Mensagem final a ser enviada:", message);

    // 7. Invocar a função de envio do Z-API
    console.log(`[Testar Template] INFO: Invocando 'zapi-send-text' para o número ${targetPhone}...`);
    const { data: zapiData, error: zapiError } = await supabaseAdmin.functions.invoke('zapi-send-text', {
      body: { phone: targetPhone, message },
    });

    if (zapiError) {
      console.error("[Testar Template] ERRO ao invocar zapi-send-text:", zapiError);
      throw new Error(`Erro na Z-API: ${zapiError.message}`);
    }
    
    console.log("[Testar Template] INFO: Resposta da Z-API:", zapiData);

    // 8. Retornar sucesso
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Mensagem de teste enviada com sucesso.",
      sent_message: message,
      zapi_response: zapiData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[Testar Template] ERRO FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});