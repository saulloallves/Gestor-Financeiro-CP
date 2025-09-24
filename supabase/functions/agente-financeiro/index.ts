import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
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

    // A tabela 'unidades' não existe neste DB, então não podemos buscar aqui.
    // Assumimos que a informação necessária (código, nome) virá de outro lugar ou será inferida.
    // Para o log, vamos usar o que temos na cobrança.
    const unidadeInfo = {
        codigo_unidade: cobranca.codigo_unidade,
        // O nome da unidade não está na tabela de cobranças.
        // A IA terá que trabalhar sem ele por enquanto, ou precisaremos de outra fonte.
        nome_padrao: `Unidade ${cobranca.codigo_unidade}`
    };

    // A relação direta com franqueado também não existe.
    // Esta parte da lógica precisará ser adaptada ou removida se não pudermos obter o franqueado.
    // Por enquanto, vamos simular um franqueado para o log.
    const franqueadoInfo = {
        id: '00000000-0000-0000-0000-000000000000', // ID genérico
        nome: `Franqueado da Unidade ${cobranca.codigo_unidade}`,
        telefone: null, // Não temos essa informação aqui
        whatsapp: null
    };

    const { data: config, error: configError } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .single();
    if (configError) throw new Error(`Configurações não encontradas: ${configError.message}`);

    // 2. Consultar a Base de Conhecimento
    const { data: contexto } = await supabaseAdmin.rpc('consultar_base_conhecimento', {
      p_prompt: `cobrança ${cobranca.tipo_cobranca} para unidade ${unidadeInfo.codigo_unidade}`,
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
      .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueadoInfo.nome)
      .replace('{{franqueado.telefone}}', franqueadoInfo.telefone || franqueadoInfo.whatsapp || 'N/A')
      .replace('{{unidade.codigo_unidade}}', unidadeInfo.codigo_unidade)
      .replace('{{unidade.nome_padrao}}', unidadeInfo.nome_padrao);

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
        const phone = franqueadoInfo.telefone || franqueadoInfo.whatsapp;
        if (phone) {
          const { data: zapiData, error: zapiError } = await supabaseAdmin.functions.invoke('zapi-send-text', {
            body: { phone, message },
          });
          if (zapiError) throw new Error(`Erro na Z-API: ${zapiError.message}`);
          actionResult = { zapiResponse: zapiData };
          
          // Registrar mensagem na tabela 'mensagens'
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
            console.error('Falha ao registrar mensagem no banco:', logError.message);
          }
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