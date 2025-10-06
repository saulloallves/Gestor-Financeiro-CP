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
    const { prompt, agentName } = await req.json();
    if (!prompt || !agentName) {
      throw new Error('`prompt` e `agentName` são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Obter configurações e prompt do agente
    const [configRes, promptRes] = await Promise.all([
      supabaseAdmin.from('configuracoes').select('ia_api_key, ia_provedor').single(),
      supabaseAdmin.from('ia_prompts').select('prompt_base, modelo_ia').eq('nome_agente', agentName).single()
    ]);

    if (configRes.error || !configRes.data?.ia_api_key) throw new Error('Configurações de IA não encontradas.');
    if (promptRes.error || !promptRes.data) throw new Error(`Agente '${agentName}' não encontrado.`);

    const { ia_api_key, ia_provedor } = configRes.data;
    const { prompt_base, modelo_ia } = promptRes.data;

    if (ia_provedor !== 'openai') throw new Error('Apenas o provedor OpenAI é suportado para Tool Calling no momento.');

    const openai = new OpenAI({ apiKey: ia_api_key });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: prompt_base },
      { role: 'user', content: prompt }
    ];

    // 2. Primeira chamada para a IA
    let response = await openai.chat.completions.create({
      model: modelo_ia,
      messages: messages,
    });

    let responseMessage = response.choices[0].message;
    let toolCall;

    try {
      toolCall = JSON.parse(responseMessage.content || '{}');
    } catch {
      toolCall = null;
    }

    // 3. Verificar se a IA solicitou uma ferramenta
    if (toolCall && toolCall.tool_name) {
      messages.push(responseMessage); // Adicionar a resposta da IA (a chamada da ferramenta) ao histórico

      console.log(`[Tool Calling] IA solicitou a ferramenta: ${toolCall.tool_name}`);

      // 4. Executar a ferramenta (função RPC)
      const { data: toolResult, error: rpcError } = await supabaseAdmin.rpc(toolCall.tool_name, toolCall.parameters || {});

      if (rpcError) {
        throw new Error(`Erro ao executar a ferramenta '${toolCall.tool_name}': ${rpcError.message}`);
      }

      // 5. Enviar o resultado da ferramenta de volta para a IA
      messages.push({
        role: 'tool',
        tool_call_id: 'not_used', // Placeholder, a API do Deno não usa isso ainda
        content: JSON.stringify(toolResult),
      });

      console.log(`[Tool Calling] Resultado da ferramenta enviado para a IA.`);

      const secondResponse = await openai.chat.completions.create({
        model: modelo_ia,
        messages: messages,
      });
      responseMessage = secondResponse.choices[0].message;
    }

    // 6. Retornar a resposta final da IA
    return new Response(JSON.stringify({ response: responseMessage.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[agente-chat-handler] Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});