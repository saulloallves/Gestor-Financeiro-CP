import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

serve(async (req) => {
  console.log("--- [Agente] Função iniciada ---");
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cobranca_id } = await req.json();
    if (!cobranca_id) {
      throw new Error('cobranca_id é obrigatório');
    }
    console.log(`[Agente] INFO: Processando cobrança ID: ${cobranca_id}`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    console.log("[Agente] INFO: Cliente Supabase Admin criado.");

    // 1. Buscar dados
    console.log("[Agente] INFO: Buscando dados da cobrança...");
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas')
      .select('*')
      .eq('id', cobranca_id)
      .single();
    if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);
    console.log("[Agente] INFO: Dados da cobrança encontrados:", cobranca);

    // **NOVA LÓGICA: CALCULAR DIAS DE ATRASO EM TEMPO REAL**
    console.log("[Agente] INFO: Calculando dias de atraso em tempo real...");
    const hoje = new Date();
    const vencimento = new Date(cobranca.vencimento);
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);
    const diffTime = hoje.getTime() - vencimento.getTime();
    const diasAtrasoReal = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    console.log(`[Agente] DEBUG: Vencimento: ${vencimento.toISOString()}, Hoje: ${hoje.toISOString()}, Dias de Atraso Calculado: ${diasAtrasoReal}`);


    // Simulação de dados de unidade e franqueado (pois não estão no mesmo DB)
    const unidadeInfo = {
        codigo_unidade: cobranca.codigo_unidade,
        nome_padrao: `Unidade ${cobranca.codigo_unidade}`
    };
    const franqueadoInfo = {
        id: '00000000-0000-0000-0000-000000000000',
        nome: `Franqueado da Unidade ${cobranca.codigo_unidade}`,
        telefone: '5511999999999', // NÚMERO DE TESTE - SUBSTITUA SE NECESSÁRIO
        whatsapp: '5511999999999' // NÚMERO DE TESTE - SUBSTITUA SE NECESSÁRIO
    };
    console.log("[Agente] DEBUG: Usando dados simulados para franqueado/unidade:", { unidadeInfo, franqueadoInfo });

    console.log("[Agente] INFO: Buscando configurações...");
    const { data: config, error: configError } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .single();
    if (configError) throw new Error(`Configurações não encontradas: ${configError.message}`);
    console.log("[Agente] INFO: Configurações encontradas.");

    // 2. Consultar Base de Conhecimento
    console.log("[Agente] INFO: Consultando base de conhecimento (RAG)...");
    const { data: contexto } = await supabaseAdmin.rpc('consultar_base_conhecimento', {
      p_prompt: `cobrança ${cobranca.tipo_cobranca} para unidade ${unidadeInfo.codigo_unidade}`,
    });
    const contextoFormatado = (contexto && contexto.length > 0)
      ? contexto.map((c: any) => `Título: ${c.titulo}\nConteúdo: ${c.conteudo}`).join('\n\n---\n\n')
      : "Nenhuma informação específica encontrada na base de conhecimento.";
    console.log(`[Agente] INFO: ${contexto?.length || 0} itens de contexto encontrados.`);

    // 3. Construir o prompt
    console.log("[Agente] INFO: Construindo prompt para a IA...");
    const prompt = (config.ia_prompt_base || '')
      .replace('{{max_parcelas_acordo}}', config.max_parcelas_acordo)
      .replace('{{juros_acordo}}', config.juros_acordo)
      .replace('{{desconto_quitacao_avista}}', config.desconto_quitacao_avista)
      .replace(new RegExp('{{dias_lembrete_previo}}', 'g'), config.dias_lembrete_previo)
      .replace(new RegExp('{{dias_escalonamento_juridico}}', 'g'), config.dias_escalonamento_juridico)
      .replace('{{contexto_rag}}', contextoFormatado)
      .replace('{{cobranca.id}}', cobranca.id)
      .replace('{{cobranca.tipo_cobranca}}', cobranca.tipo_cobranca)
      .replace('{{cobranca.valor_original}}', cobranca.valor_original)
      .replace('{{cobranca.valor_atualizado}}', cobranca.valor_atualizado)
      .replace('{{cobranca.vencimento}}', formatDate(cobranca.vencimento))
      .replace('{{cobranca.dias_atraso}}', diasAtrasoReal) // **CORREÇÃO APLICADA AQUI**
      .replace('{{cobranca.status}}', cobranca.status)
      .replace('{{cobranca.observacoes}}', cobranca.observacoes || 'N/A')
      .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueadoInfo.nome)
      .replace('{{franqueado.telefone}}', franqueadoInfo.telefone || franqueadoInfo.whatsapp || 'N/A')
      .replace('{{unidade.codigo_unidade}}', unidadeInfo.codigo_unidade)
      .replace('{{unidade.nome_padrao}}', unidadeInfo.nome_padrao);
    console.log("[Agente] DEBUG: Prompt final (primeiros 500 chars):", prompt.substring(0, 500));

    // 4. Chamar a IA
    console.log(`[Agente] INFO: Chamando OpenAI com modelo ${config.ia_modelo}...`);
    const openai = new OpenAI({ apiKey: config.ia_api_key });
    const completion = await openai.chat.completions.create({
      model: config.ia_modelo,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const aiResponseRaw = completion.choices[0].message.content || '{}';
    console.log("[Agente] INFO: Resposta bruta da IA:", aiResponseRaw);
    const aiResponse = JSON.parse(aiResponseRaw);
    const { action, message } = aiResponse;
    console.log("[Agente] INFO: Ação decidida pela IA:", action);

    // 5. Executar ação
    let actionResult: any = {};
    switch (action) {
      case 'SEND_WHATSAPP_REMINDER':
      case 'SEND_WHATSAPP_OVERDUE_NOTICE':
      case 'SEND_WHATSAPP_NEGOTIATION_PROPOSAL':
        const phone = franqueadoInfo.telefone || franqueadoInfo.whatsapp;
        if (phone) {
          console.log(`[Agente] INFO: Enviando WhatsApp para ${phone}...`);
          const { data: zapiData, error: zapiError } = await supabaseAdmin.functions.invoke('zapi-send-text', {
            body: { phone, message },
          });
          if (zapiError) throw new Error(`Erro na Z-API: ${zapiError.message}`);
          actionResult = { zapiResponse: zapiData };
          console.log("[Agente] INFO: WhatsApp enviado. Resposta Z-API:", zapiData);
          
          console.log("[Agente] INFO: Registrando mensagem no banco de dados...");
          const { error: logError } = await supabaseAdmin
            .from('mensagens')
            .insert({
              cobranca_id: cobranca.id,
              unidade_codigo_unidade: unidadeInfo.codigo_unidade,
              unidade_nome_padrao: unidadeInfo.nome_padrao,
              franqueado_id: franqueadoInfo.id,
              franqueado_nome: franqueadoInfo.nome,
              canal: 'whatsapp',
              conteudo: message,
              status_envio: 'enviado',
              external_id: zapiData?.id,
              enviado_por: 'ia_agente_financeiro'
            });
          if (logError) {
            console.error("[Agente] ERRO ao registrar mensagem:", logError.message);
          } else {
            console.log("[Agente] INFO: Mensagem registrada com sucesso.");
          }
        } else {
          throw new Error(`Franqueado da unidade ${unidadeInfo.codigo_unidade} não possui telefone.`);
        }
        break;
      case 'FLAG_FOR_LEGAL':
        console.log("[Agente] INFO: Escalando para o jurídico...");
        const { error: updateError } = await supabaseAdmin
          .from('cobrancas')
          .update({ status: 'juridico' })
          .eq('id', cobranca_id);
        if (updateError) throw new Error(`Falha ao escalar para jurídico: ${updateError.message}`);
        actionResult = { statusUpdated: 'juridico' };
        console.log("[Agente] INFO: Status da cobrança atualizado para 'juridico'.");
        break;
      case 'NO_ACTION':
        actionResult = { message: 'Nenhuma ação foi tomada.' };
        console.log("[Agente] INFO: Nenhuma ação necessária.");
        break;
      default:
        throw new Error(`Ação desconhecida recebida da IA: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, aiResponse, actionResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[Agente] ERRO FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});