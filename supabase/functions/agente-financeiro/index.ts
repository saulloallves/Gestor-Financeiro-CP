import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para formatar datas
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cobranca_id } = await req.json();
    if (!cobranca_id) {
      throw new Error('cobranca_id é obrigatório');
    }

    // Usa a chave de serviço para bypassar RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar todos os dados necessários
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas')
      .select('*')
      .eq('id', cobranca_id)
      .single();
    if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);

    const { data: unidade, error: unidadeError } = await supabaseAdmin
      .from('unidades')
      .select('*')
      .eq('codigo_unidade', cobranca.codigo_unidade)
      .single();
    if (unidadeError) throw new Error(`Unidade não encontrada para o código ${cobranca.codigo_unidade}: ${unidadeError.message}`);

    // A relação franqueado-unidade não está direta, então buscamos na tabela de junção
    const { data: franqueadoLink, error: linkError } = await supabaseAdmin
      .from('franqueados_unidades')
      .select('franqueado_id')
      .eq('unidade_id', unidade.id)
      .eq('ativo', true)
      .limit(1)
      .single();
    if (linkError || !franqueadoLink) throw new Error(`Link de franqueado não encontrado para a unidade ${unidade.id}: ${linkError?.message}`);

    const { data: franqueado, error: franqueadoError } = await supabaseAdmin
      .from('franqueados')
      .select('*')
      .eq('id', franqueadoLink.franqueado_id)
      .single();
    if (franqueadoError) throw new Error(`Franqueado não encontrado para o ID ${franqueadoLink.franqueado_id}: ${franqueadoError.message}`);

    const { data: config, error: configError } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .single();
    if (configError) throw new Error(`Configurações não encontradas: ${configError.message}`);

    // 2. Consultar a Base de Conhecimento
    const { data: contexto } = await supabaseAdmin.rpc('consultar_base_conhecimento', {
      p_prompt: `cobrança ${cobranca.tipo_cobranca} para unidade ${unidade.codigo_unidade}`,
    });
    const contextoFormatado = (contexto && contexto.length > 0)
      ? contexto.map((c: any) => `Título: ${c.titulo}\nConteúdo: ${c.conteudo}`).join('\n\n---\n\n')
      : "Nenhuma informação específica encontrada na base de conhecimento.";

    // 3. Construir o prompt para a IA
    let prompt = config.ia_prompt_base
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
      .replace('{{cobranca.dias_atraso}}', cobranca.dias_atraso)
      .replace('{{cobranca.status}}', cobranca.status)
      .replace('{{cobranca.observacoes}}', cobranca.observacoes || 'N/A')
      .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueado.nome)
      .replace('{{franqueado.telefone}}', franqueado.telefone || franqueado.whatsapp)
      .replace('{{unidade.codigo_unidade}}', unidade.codigo_unidade)
      .replace('{{unidade.nome_padrao}}', unidade.nome_padrao);

    // 4. Chamar o provedor de IA
    const openai = new OpenAI({ apiKey: config.ia_api_key });
    const completion = await openai.chat.completions.create({
      model: config.ia_modelo,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
    const { action, message } = aiResponse;

    // 5. Executar a ação decidida pela IA
    let actionResult: any = {};
    switch (action) {
      case 'SEND_WHATSAPP_REMINDER':
      case 'SEND_WHATSAPP_OVERDUE_NOTICE':
      case 'SEND_WHATSAPP_NEGOTIATION_PROPOSAL':
        const phone = franqueado.telefone || franqueado.whatsapp;
        if (phone) {
          const { data: zapiData, error: zapiError } = await supabaseAdmin.functions.invoke('zapi-send-text', {
            body: { phone, message },
          });
          if (zapiError) throw new Error(`Erro na Z-API: ${zapiError.message}`);
          actionResult = { zapiResponse: zapiData };
          // TODO: Registrar esta mensagem na tabela 'mensagens'
        } else {
          throw new Error(`Franqueado ${franqueado.id} não possui telefone.`);
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