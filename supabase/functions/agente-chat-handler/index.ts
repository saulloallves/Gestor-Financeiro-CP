import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Definição estruturada das ferramentas para a API da OpenAI
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_system_stats',
      description: 'Retorna estatísticas gerais do sistema, como totais de unidades, franqueados e cobranças.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_unit_details_by_code',
      description: 'Busca os detalhes completos de uma unidade específica pelo seu código de 4 dígitos.',
      parameters: {
        type: 'object',
        properties: {
          codigo_param: { type: 'string', description: 'O código de 4 dígitos da unidade. Ex: "1659"' },
        },
        required: ['codigo_param'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_franchisee_details_by_cpf',
      description: 'Busca os detalhes de um franqueado pelo seu CPF.',
      parameters: {
        type: 'object',
        properties: {
          cpf_param: { type: 'string', description: 'O CPF do franqueado, apenas números. Ex: "12345678900"' },
        },
        required: ['cpf_param'],
      },
    },
  },
];

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

    // Primeira chamada para a IA, agora com a lista de ferramentas
    const response = await openai.chat.completions.create({
      model: modelo_ia,
      messages: messages,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // Verificar se a IA solicitou uma ou mais ferramentas
    if (toolCalls) {
      messages.push(responseMessage); // Adicionar a resposta da IA ao histórico

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[Tool Calling] IA solicitou: ${functionName} com args:`, functionArgs);

        // Executar a função RPC correspondente
        const { data: functionResponse, error: rpcError } = await supabaseAdmin.rpc(functionName, functionArgs);

        if (rpcError) {
          throw new Error(`Erro ao executar a ferramenta '${functionName}': ${rpcError.message}`);
        }

        // Enviar o resultado da ferramenta de volta para a IA
        messages.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          content: JSON.stringify(functionResponse),
        });
      }

      // Segunda chamada para a IA com os resultados das ferramentas
      const secondResponse = await openai.chat.completions.create({
        model: modelo_ia,
        messages: messages,
      });
      
      return new Response(JSON.stringify({ response: secondResponse.choices[0].message.content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Se nenhuma ferramenta foi chamada, retornar a resposta diretamente
      return new Response(JSON.stringify({ response: responseMessage.content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

  } catch (error) {
    console.error('[agente-chat-handler] Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});