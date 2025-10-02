import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let cobranca_id: string | null = null;

  try {
    const body = await req.json();
    const { template_name } = body;
    cobranca_id = body.cobranca_id;

    if (!cobranca_id || !template_name) {
      throw new Error('`cobranca_id` e `template_name` são obrigatórios.');
    }

    console.log(`--- [Notificação] Iniciando envio para cobrança ${cobranca_id} com template ${template_name} ---`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar todos os dados necessários em paralelo
    const [cobrancaRes, configRes, promptRes, templateRes] = await Promise.all([
      supabaseAdmin.from('cobrancas').select('*').eq('id', cobranca_id).single(),
      supabaseAdmin.from('configuracoes').select('ia_api_key').single(),
      supabaseAdmin.from('ia_prompts').select('prompt_base, modelo_ia').eq('nome_agente', 'agente_notificacao_whatsapp').single(),
      supabaseAdmin.from('templates').select('id, conteudo').eq('nome', template_name).single()
    ]);

    if (cobrancaRes.error) throw new Error(`Cobrança não encontrada: ${cobrancaRes.error.message}`);
    if (configRes.error) throw new Error(`Configurações não encontradas: ${configRes.error.message}`);
    if (promptRes.error) throw new Error(`Prompt 'agente_notificacao_whatsapp' não encontrado.`);
    if (templateRes.error) throw new Error(`Template '${template_name}' não encontrado.`);

    const cobranca = cobrancaRes.data;
    const config = configRes.data;
    const promptData = promptRes.data;
    const template = templateRes.data;

    const { data: franqueadoData, error: rpcError } = await supabaseAdmin.rpc('get_franchisee_by_unit_code', {
      codigo_param: String(cobranca.codigo_unidade),
    });
    if (rpcError || !franqueadoData || franqueadoData.length === 0) {
      throw new Error(`Franqueado/Unidade não encontrado para unidade ${cobranca.codigo_unidade}: ${rpcError?.message || 'Sem dados'}`);
    }
    const franqueadoUnidadeInfo = franqueadoData[0];
    const targetPhone = franqueadoUnidadeInfo.whatsapp || franqueadoUnidadeInfo.telefone;
    if (!targetPhone) {
      throw new Error(`Franqueado ${franqueadoUnidadeInfo.nome} não possui número de WhatsApp ou telefone cadastrado.`);
    }

    // 2. Montar o prompt para a IA preencher o template
    const promptFinal = (promptData.prompt_base || '')
      .replace('{{template_conteudo}}', template.conteudo)
      .replace('{{franqueado.nome}}', franqueadoUnidadeInfo.nome)
      .replace('{{unidade.codigo_unidade}}', franqueadoUnidadeInfo.codigo_unidade)
      .replace('{{cobranca.valor_atualizado}}', cobranca.valor_atualizado.toFixed(2).replace('.', ','))
      .replace('{{cobranca.vencimento}}', formatDate(cobranca.vencimento))
      .replace('{{cobranca.link_pagamento}}', cobranca.link_pagamento || `https://crescieperdi.com.br/pagamento/${cobranca.id}`)
      .replace('{{cobranca.tipo_cobranca}}', cobranca.tipo_cobranca);

    // 3. Chamar a IA para obter a mensagem final
    const openai = new OpenAI({ apiKey: config.ia_api_key });
    const completion = await openai.chat.completions.create({
      model: promptData.modelo_ia,
      messages: [{ role: 'user', content: promptFinal }],
      response_format: { type: "json_object" },
    });

    const aiResponseRaw = completion.choices[0].message.content || '{}';
    const aiResponse = JSON.parse(aiResponseRaw);
    const finalMessage = aiResponse.mensagem_final;

    if (!finalMessage) {
      throw new Error('A IA não retornou uma mensagem final válida.');
    }
    console.log(`[Notificação] Mensagem final gerada para ${cobranca_id}: "${finalMessage.substring(0, 50)}..."`);

    // 4. Preparar dados para o log de comunicação
    const logData = {
      cobranca_id: cobranca.id,
      unidade_id: franqueadoUnidadeInfo.unidade_id, // Assumindo que a RPC retorna isso
      unidade_codigo_unidade: franqueadoUnidadeInfo.codigo_unidade,
      unidade_nome_padrao: franqueadoUnidadeInfo.nome_unidade,
      franqueado_id: franqueadoUnidadeInfo.id,
      franqueado_nome: franqueadoUnidadeInfo.nome,
      tipo_mensagem: 'automatica',
      template_id: template.id,
      enviado_por: 'ia_agente_financeiro',
      enviado_por_ia: true,
    };

    // 5. Invocar a função de envio do Z-API, passando os dados de log
    const { data: zapiData, error: zapiError } = await supabaseAdmin.functions.invoke('zapi-send-text', {
      body: { phone: targetPhone, message: finalMessage, logData },
    });

    if (zapiError) {
      throw new Error(`Erro na Z-API: ${zapiError.message}`);
    }

    console.log(`[Notificação] Sucesso! Mensagem enviada para ${targetPhone} via Z-API.`);

    return new Response(JSON.stringify({ success: true, message: "Mensagem enviada com sucesso.", zapi_response: zapiData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[Notificação] ERRO FATAL para cobrança ID ${cobranca_id}:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});