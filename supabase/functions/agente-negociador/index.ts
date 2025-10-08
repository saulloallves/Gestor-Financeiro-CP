import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cobranca_id, negociacao_id, user_message } = await req.json();
    if (!cobranca_id && !negociacao_id) {
      throw new Error('É necessário fornecer `cobranca_id` (para iniciar) ou `negociacao_id` (para continuar).');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let negociacao;
    let cobranca;
    let franqueadoUnidadeInfo;
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // --- LÓGICA DE INICIAÇÃO VS CONTINUAÇÃO ---
    if (cobranca_id) { // Iniciar nova negociação
      console.log(`[Negociador] Iniciando nova negociação para cobrança ${cobranca_id}`);
      
      // Buscar dados
      const { data: cobrancaData, error: cobrancaError } = await supabaseAdmin.from('cobrancas').select('*').eq('id', cobranca_id).single();
      if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);
      cobranca = cobrancaData;

      const { data: franqueadoData, error: rpcError } = await supabaseAdmin.rpc('get_franchisee_by_unit_code', { codigo_param: String(cobranca.codigo_unidade) });
      if (rpcError || !franqueadoData || franqueadoData.length === 0) throw new Error(`Franqueado não encontrado para unidade ${cobranca.codigo_unidade}`);
      franqueadoUnidadeInfo = franqueadoData[0];

      // Criar registro de negociação
      const { data: novaNegociacao, error: negociacaoError } = await supabaseAdmin.from('negociacoes').insert({ cobranca_id: cobranca.id, franqueado_id: franqueadoUnidadeInfo.id }).select().single();
      if (negociacaoError) throw new Error(`Erro ao criar negociação: ${negociacaoError.message}`);
      negociacao = novaNegociacao;

    } else { // Continuar negociação existente
      console.log(`[Negociador] Continuando negociação ${negociacao_id}`);
      if (!user_message) throw new Error('`user_message` é obrigatório para continuar uma negociação.');

      // Registrar mensagem recebida
      await supabaseAdmin.from('interacoes_negociacao').insert({ negociacao_id, mensagem_recebida: user_message });

      // Buscar dados da negociação e seu histórico
      const { data: negociacaoData, error: negociacaoError } = await supabaseAdmin.from('negociacoes').select('*, cobrancas(*), franqueados(*)').eq('id', negociacao_id).single();
      if (negociacaoError) throw new Error(`Negociação não encontrada: ${negociacaoError.message}`);
      negociacao = negociacaoData;
      cobranca = negociacao.cobrancas;
      franqueadoUnidadeInfo = { nome: negociacao.franqueados.nome }; // Simplificado

      const { data: history } = await supabaseAdmin.from('interacoes_negociacao').select('*').eq('negociacao_id', negociacao_id).order('data_hora');
      history?.forEach(h => {
        if (h.mensagem_enviada) messages.push({ role: 'assistant', content: h.mensagem_enviada });
        if (h.mensagem_recebida) messages.push({ role: 'user', content: h.mensagem_recebida });
      });
    }

    // --- LÓGICA COMUM: CHAMAR IA E ENVIAR MENSAGEM ---
    const { data: config } = await supabaseAdmin.from('configuracoes').select('*').single();
    const { data: promptData } = await supabaseAdmin.from('ia_prompts').select('prompt_base, modelo_ia').eq('nome_agente', 'agente_negociador').single();
    if (!config || !promptData) throw new Error('Configurações ou prompt do agente negociador não encontrados.');

    const promptFinal = (promptData.prompt_base || '')
      .replace('{{cobranca.valor_atualizado}}', cobranca.valor_atualizado.toFixed(2))
      .replace('{{franqueado.nome}}', franqueadoUnidadeInfo.nome)
      .replace('{{config.max_parcelas_acordo}}', String(config.max_parcelas_acordo || 6))
      .replace('{{config.juros_acordo}}', String(config.juros_acordo || 1.50))
      .replace('{{config.desconto_quitacao_avista}}', String(config.desconto_quitacao_avista || 5.00));
      
    messages.unshift({ role: 'system', content: promptFinal });
    if (!user_message) messages.push({ role: 'user', content: 'Inicie a conversa.' });

    const openai = new OpenAI({ apiKey: config.ia_api_key });
    const completion = await openai.chat.completions.create({
      model: promptData.modelo_ia,
      messages,
    });
    const respostaIA = completion.choices[0].message.content || 'Desculpe, não consegui processar sua solicitação.';

    // Enviar resposta via Z-API
    const targetPhone = franqueadoUnidadeInfo.whatsapp || franqueadoUnidadeInfo.telefone;
    if (!targetPhone) throw new Error(`Franqueado ${franqueadoUnidadeInfo.nome} não possui número de contato.`);

    await supabaseAdmin.functions.invoke('zapi-send-text', {
      body: { phone: targetPhone, message: respostaIA },
    });

    // Registrar mensagem enviada
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