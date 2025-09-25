import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cobranca_id } = await req.json();
    if (!cobranca_id) throw new Error('cobranca_id é obrigatório');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar a cobrança para obter o código da unidade
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas')
      .select('*')
      .eq('id', cobranca_id)
      .single();
    if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);

    // 2. Buscar dados reais do franqueado e da unidade usando o código da unidade
    const { data: franqueadoData, error: rpcError } = await supabaseAdmin.rpc('get_franchisee_by_unit_code', {
      codigo_param: String(cobranca.codigo_unidade),
    });

    if (rpcError) throw new Error(`Erro ao buscar franqueado/unidade: ${rpcError.message}`);
    if (!franqueadoData || franqueadoData.length === 0) {
      throw new Error(`Nenhum franqueado principal encontrado para a unidade ${cobranca.codigo_unidade}`);
    }
    
    const franqueadoUnidadeInfo = franqueadoData[0];
    
    // Mapear para os objetos esperados
    const unidadeInfo = {
        codigo_unidade: franqueadoUnidadeInfo.codigo_unidade,
        nome_padrao: franqueadoUnidadeInfo.nome_unidade
    };
    const franqueadoInfo = {
        id: franqueadoUnidadeInfo.id,
        nome: franqueadoUnidadeInfo.nome,
        telefone: franqueadoUnidadeInfo.telefone,
        whatsapp: franqueadoUnidadeInfo.whatsapp
    };

    const hoje = new Date();
    const vencimento = new Date(cobranca.vencimento);
    hoje.setHours(0, 0, 0, 0);
    vencimento.setHours(0, 0, 0, 0);
    const diffTime = hoje.getTime() - vencimento.getTime();
    const diasAtrasoReal = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const { data: config, error: configError } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .single();
    if (configError) throw new Error(`Configurações não encontradas: ${configError.message}`);

    const { data: contexto } = await supabaseAdmin.rpc('consultar_base_conhecimento', {
      p_prompt: `cobrança ${cobranca.tipo_cobranca} para unidade ${unidadeInfo.codigo_unidade}`,
    });
    const contextoFormatado = (contexto && contexto.length > 0)
      ? contexto.map((c: any) => `Título: ${c.titulo}\nConteúdo: ${c.conteudo}`).join('\n\n---\n\n')
      : "Nenhuma informação específica encontrada na base de conhecimento.";

    const prompt = (config.ia_prompt_base || '')
      .replace('{{contexto_rag}}', contextoFormatado)
      .replace('{{cobranca.id}}', cobranca.id)
      .replace('{{cobranca.tipo_cobranca}}', cobranca.tipo_cobranca)
      .replace('{{cobranca.valor_original}}', cobranca.valor_original)
      .replace('{{cobranca.valor_atualizado}}', cobranca.valor_atualizado)
      .replace('{{cobranca.vencimento}}', formatDate(cobranca.vencimento))
      .replace('{{cobranca.dias_atraso}}', diasAtrasoReal)
      .replace('{{cobranca.status}}', cobranca.status)
      .replace('{{cobranca.observacoes}}', cobranca.observacoes || 'N/A')
      .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueadoInfo.nome)
      .replace('{{franqueado.telefone}}', franqueadoInfo.telefone || franqueadoInfo.whatsapp || 'N/A')
      .replace('{{unidade.codigo_unidade}}', unidadeInfo.codigo_unidade)
      .replace('{{unidade.nome_padrao}}', unidadeInfo.nome_padrao);

    const openai = new OpenAI({ apiKey: config.ia_api_key });
    const completion = await openai.chat.completions.create({
      model: config.ia_modelo,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const aiResponseRaw = completion.choices[0].message.content || '{}';
    const aiResponse = JSON.parse(aiResponseRaw);
    const { action, template_name } = aiResponse;

    let actionResult: any = {};
    switch (action) {
      case 'SEND_WHATSAPP':
        const phone = franqueadoInfo.telefone || franqueadoInfo.whatsapp;
        if (phone) {
          const { data: templateData, error: templateError } = await supabaseAdmin
            .from('templates')
            .select('id, conteudo')
            .eq('nome', template_name)
            .eq('canal', 'whatsapp')
            .single();
          
          if (templateError || !templateData) {
            throw new Error(`Template '${template_name}' não encontrado ou erro ao buscar.`);
          }

          const message = templateData.conteudo
            .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueadoInfo.nome)
            .replace(new RegExp('{{unidade.codigo_unidade}}', 'g'), String(unidadeInfo.codigo_unidade))
            .replace(new RegExp('{{cobranca.valor_atualizado}}', 'g'), cobranca.valor_atualizado.toFixed(2).replace('.', ','))
            .replace(new RegExp('{{cobranca.vencimento}}', 'g'), formatDate(cobranca.vencimento))
            .replace(new RegExp('{{cobranca.link_pagamento}}', 'g'), cobranca.link_pagamento || 'Link não disponível');

          const logData = {
            cobranca_id: cobranca.id,
            unidade_codigo_unidade: unidadeInfo.codigo_unidade,
            unidade_nome_padrao: unidadeInfo.nome_padrao,
            franqueado_id: franqueadoInfo.id,
            franqueado_nome: franqueadoInfo.nome,
            template_id: templateData.id,
            tipo_mensagem: 'automatica',
            enviado_por: 'ia_agente_financeiro',
            enviado_por_ia: true,
          };

          const { data: zapiData, error: zapiError } = await supabaseAdmin.functions.invoke('zapi-send-text', {
            body: { phone, message, logData },
          });
          if (zapiError) throw new Error(`Erro na Z-API: ${zapiError.message}`);
          actionResult = { zapiResponse: zapiData };
        } else {
          throw new Error(`Franqueado da unidade ${unidadeInfo.codigo_unidade} não possui telefone.`);
        }
        break;
      case 'FLAG_FOR_LEGAL':
        const { error: updateError } = await supabaseAdmin
          .from('cobrancas')
          .update({ status: 'juridico' })
          .eq('id', cobranca_id);
        if (updateError) throw new Error(`Falha ao escalar para jurídico: ${updateError.message}`);
        actionResult = { statusUpdated: 'juridico' };
        break;
      case 'NO_ACTION':
        actionResult = { message: 'Nenhuma ação foi tomada.' };
        break;
      default:
        throw new Error(`Ação desconhecida recebida da IA: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, aiResponse, actionResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});