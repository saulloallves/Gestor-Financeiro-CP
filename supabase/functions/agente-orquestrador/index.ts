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
    cobranca_id = body.cobranca_id;
    if (!cobranca_id) throw new Error('cobranca_id é obrigatório');

    console.log(`--- [Orquestrador] Iniciando análise para cobrança ID: ${cobranca_id} ---`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar dados da cobrança, franqueado e unidade
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin.from('cobrancas').select('*').eq('id', cobranca_id).single();
    if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);

    const { data: franqueadoData, error: rpcError } = await supabaseAdmin.rpc('get_franchisee_by_unit_code', {
      codigo_param: String(cobranca.codigo_unidade),
    });
    if (rpcError || !franqueadoData || franqueadoData.length === 0) {
      throw new Error(`Franqueado/Unidade não encontrado para unidade ${cobranca.codigo_unidade}: ${rpcError?.message || 'Sem dados'}`);
    }
    const franqueadoUnidadeInfo = franqueadoData[0];

    // 2. Buscar configurações e o prompt específico do orquestrador
    const { data: config, error: configError } = await supabaseAdmin.from('configuracoes').select('*').single();
    if (configError) throw new Error(`Configurações não encontradas: ${configError.message}`);

    const { data: promptData, error: promptError } = await supabaseAdmin.from('ia_prompts').select('prompt_base, modelo_ia').eq('nome_agente', 'agente_orquestrador').single();
    if (promptError || !promptData) throw new Error(`Prompt para 'agente_orquestrador' não encontrado.`);

    // 3. Consultar base de conhecimento (RAG)
    const { data: contexto } = await supabaseAdmin.rpc('consultar_base_conhecimento', {
      p_prompt: `cobrança ${cobranca.tipo_cobranca} para unidade ${cobranca.codigo_unidade}`,
    });
    const contextoFormatado = (contexto && contexto.length > 0)
      ? contexto.map((c: any) => `Título: ${c.titulo}\nConteúdo: ${c.conteudo}`).join('\n\n---\n\n')
      : "Nenhuma informação específica encontrada na base de conhecimento.";

    // 4. Montar o prompt final
    const hojeUTC = new Date();
    hojeUTC.setUTCHours(0, 0, 0, 0);
    const vencimentoUTC = new Date(cobranca.vencimento);
    const diffTime = hojeUTC.getTime() - vencimentoUTC.getTime();
    const diasAtrasoReal = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const promptFinal = (promptData.prompt_base || '')
      .replace('{{contexto_rag}}', contextoFormatado)
      .replace('{{cobranca.id}}', cobranca.id)
      .replace('{{cobranca.tipo_cobranca}}', cobranca.tipo_cobranca)
      .replace('{{cobranca.valor_atualizado}}', cobranca.valor_atualizado.toFixed(2))
      .replace('{{cobranca.vencimento}}', formatDate(cobranca.vencimento))
      .replace('{{cobranca.dias_atraso}}', String(diasAtrasoReal))
      .replace('{{cobranca.status}}', cobranca.status)
      .replace('{{cobranca.observacoes}}', cobranca.observacoes || 'N/A')
      .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueadoUnidadeInfo.nome)
      .replace('{{unidade.codigo_unidade}}', franqueadoUnidadeInfo.codigo_unidade)
      .replace('{{unidade.nome_padrao}}', franqueadoUnidadeInfo.nome_unidade)
      .replace('{{config.dias_lembrete_previo}}', String(config.dias_lembrete_previo || 3));

    // 5. Chamar a IA para obter a decisão
    const openai = new OpenAI({ apiKey: config.ia_api_key });
    const completion = await openai.chat.completions.create({
      model: promptData.modelo_ia,
      messages: [{ role: 'user', content: promptFinal }],
      response_format: { type: "json_object" },
    });

    const aiDecisionRaw = completion.choices[0].message.content || '{}';
    const aiDecision = JSON.parse(aiDecisionRaw);

    console.log(`[Orquestrador] ${cobranca_id}: Decisão da IA:`, aiDecision);

    // 6. Retornar a decisão para o agendador
    return new Response(JSON.stringify({ success: true, decision: aiDecision }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[Orquestrador] ERRO FATAL para cobrança ID ${cobranca_id}:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});