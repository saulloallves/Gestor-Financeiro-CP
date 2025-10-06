import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Definição das ferramentas (com a nova função adicionada)
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  { type: 'function', function: { name: 'get_system_stats', description: 'Retorna estatísticas gerais do sistema.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'get_unit_details_by_code', description: 'Busca detalhes de uma unidade pelo código.', parameters: { type: 'object', properties: { codigo_param: { type: 'string' } }, required: ['codigo_param'] } } },
  { type: 'function', function: { name: 'get_franchisee_details_by_cpf', description: 'Busca detalhes de um franqueado pelo CPF.', parameters: { type: 'object', properties: { cpf_param: { type: 'string' } }, required: ['cpf_param'] } } },
  { 
    type: 'function', 
    function: { 
      name: 'get_cobrancas_by_filter', 
      description: 'Busca cobranças no sistema com base em filtros opcionais como código da unidade ou status.', 
      parameters: { 
        type: 'object', 
        properties: { 
          p_codigo_unidade: { type: 'integer', description: 'O código de 4 dígitos da unidade.' },
          p_status: { type: 'string', description: 'O status da cobrança (ex: vencido, pago, pendente).', enum: ['pendente', 'pago', 'vencido', 'cancelado', 'em_aberto', 'negociado', 'em_atraso', 'juridico', 'parcelado'] }
        } 
      } 
    } 
  },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt, agentName, chatId: existingChatId } = await req.json();
    if (!prompt || !agentName) throw new Error('`prompt` e `agentName` são obrigatórios.');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const [configRes, promptRes] = await Promise.all([
      supabase.from('configuracoes').select('ia_api_key, ia_provedor').single(),
      supabase.from('ia_prompts').select('prompt_base, modelo_ia').eq('nome_agente', agentName).single()
    ]);

    if (configRes.error || !configRes.data?.ia_api_key) throw new Error('Configurações de IA não encontradas.');
    if (promptRes.error || !promptRes.data) throw new Error(`Agente '${agentName}' não encontrado.`);

    const { ia_api_key, ia_provedor } = configRes.data;
    const { prompt_base, modelo_ia } = promptRes.data;
    if (ia_provedor !== 'openai') throw new Error('Apenas OpenAI é suportado para Tool Calling.');

    const openai = new OpenAI({ apiKey: ia_api_key });
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'system', content: prompt_base }];
    let chatId = existingChatId;

    // Se for uma conversa existente, carregar histórico
    if (chatId) {
      const { data: history, error } = await supabase.from('chat_messages').select('role, content').eq('chat_id', chatId).order('created_at');
      if (error) throw new Error('Erro ao carregar histórico do chat.');
      if (history) {
        messages.push(...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      }
    }
    messages.push({ role: 'user', content: prompt });

    // Primeira chamada para a IA
    const response = await openai.chat.completions.create({ model: modelo_ia, messages, tools, tool_choice: "auto" });
    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // Lógica de Tool Calling
    if (toolCalls) {
      messages.push(responseMessage);
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const { data: functionResponse, error: rpcError } = await supabase.rpc(functionName, functionArgs);
        if (rpcError) throw new Error(`Erro na ferramenta '${functionName}': ${rpcError.message}`);
        messages.push({ tool_call_id: toolCall.id, role: 'tool', content: JSON.stringify(functionResponse) });
      }
      const secondResponse = await openai.chat.completions.create({ model: modelo_ia, messages });
      responseMessage.content = secondResponse.choices[0].message.content;
    }

    const assistantResponse = responseMessage.content || "Desculpe, não consegui processar sua solicitação.";

    // Salvar no banco de dados
    if (!chatId) {
      // Criar novo chat
      const { data: newChat, error } = await supabase.from('chats').insert({ user_id: user.id }).select('id').single();
      if (error) throw new Error('Erro ao criar novo chat.');
      chatId = newChat.id;

      // Gerar título para o novo chat
      const titlePrompt = `Gere um título curto e descritivo (máximo 5 palavras) para a seguinte conversa:\n\nUsuário: ${prompt}\nAssistente: ${assistantResponse}`;
      const titleCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: titlePrompt }],
      });
      const title = titleCompletion.choices[0].message.content?.replace(/"/g, '') || 'Nova Conversa';
      await supabase.from('chats').update({ title }).eq('id', chatId);
    }

    // Salvar mensagens
    await supabase.from('chat_messages').insert([
      { chat_id: chatId, role: 'user', content: prompt },
      { chat_id: chatId, role: 'assistant', content: assistantResponse },
    ]);

    return new Response(JSON.stringify({ response: assistantResponse, chatId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('[agente-chat-handler] Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});