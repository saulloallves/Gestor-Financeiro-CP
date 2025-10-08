import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Definição das ferramentas que a IA pode usar
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'gerar_proposta_parcelamento',
      description: 'Gera uma proposta de parcelamento no Asaas quando o franqueado aceita a condição.',
      parameters: {
        type: 'object',
        properties: {
          cobranca_id: { type: 'string', description: 'O ID da cobrança original.' },
          num_parcelas: { type: 'number', description: 'O número de parcelas acordado.' },
        },
        required: ['cobranca_id', 'num_parcelas'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'gerar_proposta_desconto_avista',
      description: 'Gera uma nova cobrança com desconto para pagamento à vista no Asaas.',
      parameters: {
        type: 'object',
        properties: {
          cobranca_id: { type: 'string', description: 'O ID da cobrança original.' },
        },
        required: ['cobranca_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalar_para_humano',
      description: 'Escala a negociação para um atendente humano quando solicitado pelo franqueado.',
      parameters: {
        type: 'object',
        properties: {
          negociacao_id: { type: 'string', description: 'O ID da negociação atual.' },
        },
        required: ['negociacao_id'],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { cobranca_id, negociacao_id, user_message } = await req.json();
    if (!cobranca_id && !negociacao_id) throw new Error('`cobranca_id` ou `negociacao_id` é obrigatório.');

    let negociacao, cobranca, franqueadoUnidadeInfo;
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (cobranca_id) { // Iniciar nova negociação
      const { data: cData, error: cError } = await supabaseAdmin.from('cobrancas').select('*').eq('id', cobranca_id).single();
      if (cError) throw new Error(`Cobrança não encontrada: ${cError.message}`);
      cobranca = cData;

      const { data: fData, error: fError } = await supabaseAdmin.rpc('get_franchisee_by_unit_code', { codigo_param: String(cobranca.codigo_unidade) });
      if (fError || !fData || fData.length === 0) throw new Error(`Franqueado não encontrado para unidade ${cobranca.codigo_unidade}`);
      franqueadoUnidadeInfo = fData[0];

      const { data: nData, error: nError } = await supabaseAdmin.from('negociacoes').insert({ cobranca_id: cobranca.id, franqueado_id: franqueadoUnidadeInfo.id }).select().single();
      if (nError) throw new Error(`Erro ao criar negociação: ${nError.message}`);
      negociacao = nData;
    } else { // Continuar negociação
      await supabaseAdmin.from('interacoes_negociacao').insert({ negociacao_id, mensagem_recebida: user_message });
      const { data: nData, error: nError } = await supabaseAdmin.from('negociacoes').select('*, cobrancas(*), franqueados(*)').eq('id', negociacao_id).single();
      if (nError) throw new Error(`Negociação não encontrada: ${nError.message}`);
      negociacao = nData;
      cobranca = negociacao.cobrancas;
      franqueadoUnidadeInfo = { ...negociacao.franqueados, ...await supabaseAdmin.rpc('get_franchisee_by_unit_code', { codigo_param: String(cobranca.codigo_unidade) }).then(r => r.data[0]) };

      const { data: history } = await supabaseAdmin.from('interacoes_negociacao').select('*').eq('negociacao_id', negociacao_id).order('data_hora');
      history?.forEach(h => {
        if (h.mensagem_enviada) messages.push({ role: 'assistant', content: h.mensagem_enviada });
        if (h.mensagem_recebida) messages.push({ role: 'user', content: h.mensagem_recebida });
      });
    }

    const { data: config } = await supabaseAdmin.from('configuracoes').select('*').single();
    const { data: promptData } = await supabaseAdmin.from('ia_prompts').select('prompt_base, modelo_ia').eq('nome_agente', 'agente_negociador').single();
    if (!config || !promptData) throw new Error('Configurações ou prompt não encontrados.');

    const historicoFormatado = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const promptFinal = (promptData.prompt_base || '')
      .replace('{{cobranca.valor_atualizado}}', cobranca.valor_atualizado.toFixed(2))
      .replace('{{franqueado.nome}}', franqueadoUnidadeInfo.nome)
      .replace('{{config.max_parcelas_acordo}}', String(config.max_parcelas_acordo || 6))
      .replace('{{config.juros_acordo}}', String(config.juros_acordo || 1.50))
      .replace('{{config.desconto_quitacao_avista}}', String(config.desconto_quitacao_avista || 5.00))
      .replace('{{historico_conversa}}', historicoFormatado);

    messages.unshift({ role: 'system', content: promptFinal });
    if (user_message) {
      messages.push({ role: 'user', content: user_message });
    } else {
      messages.push({ role: 'user', content: 'Inicie a conversa.' });
    }

    const openai = new OpenAI({ apiKey: config.ia_api_key });
    const response = await openai.chat.completions.create({ model: promptData.modelo_ia, messages, tools, tool_choice: "auto" });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    if (toolCalls) {
      messages.push(responseMessage);
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        let functionResponse = '';

        if (functionName === 'escalar_para_humano') {
          await supabaseAdmin.from('negociacoes').update({ status: 'escalada' }).eq('id', functionArgs.negociacao_id);
          functionResponse = 'Negociação escalada para um atendente humano.';
        }
        // Adicionar lógica para outras ferramentas aqui no futuro

        messages.push({ tool_call_id: toolCall.id, role: 'tool', content: functionResponse });
      }
      const secondResponse = await openai.chat.completions.create({ model: promptData.modelo_ia, messages });
      responseMessage.content = secondResponse.choices[0].message.content;
    }

    const respostaIA = responseMessage.content || 'Desculpe, não consegui processar sua solicitação.';
    const targetPhone = franqueadoUnidadeInfo.whatsapp || franqueadoUnidadeInfo.telefone;
    if (!targetPhone) throw new Error(`Franqueado ${franqueadoUnidadeInfo.nome} não possui número de contato.`);

    await supabaseAdmin.functions.invoke('zapi-send-text', { body: { phone: targetPhone, message: respostaIA } });
    await supabaseAdmin.from('interacoes_negociacao').insert({ negociacao_id: negociacao.id, mensagem_enviada: respostaIA });
    await supabaseAdmin.from('negociacoes').update({ ultima_interacao: new Date().toISOString() }).eq('id', negociacao.id);

    return new Response(JSON.stringify({ success: true, message: "Mensagem enviada." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('[agente-negociador] ERRO FATAL:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});