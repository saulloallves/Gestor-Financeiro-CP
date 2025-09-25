// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

serve(async (req) => {
  console.log("--- [Testar Template] Função iniciada ---");
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // 1. Segurança: Apenas usuários autenticados podem testar
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader?.replace('Bearer ', ''));
    if (userError || !user) {
      console.error("[Testar Template] ERRO de autenticação:", userError?.message);
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`[Testar Template] INFO: Autorização OK para usuário ${user.email}.`);

    // 2. Obter parâmetros do corpo da requisição
    const { cobranca_id, template_name, phone_number } = await req.json();
    if (!cobranca_id || !template_name) {
      throw new Error('`cobranca_id` e `template_name` são obrigatórios.');
    }
    
    const targetPhone = phone_number || '5511981996294'; // Fallback seguro
    console.log(`[Testar Template] INFO: Parâmetros: cobranca_id=${cobranca_id}, template_name=${template_name}, phone=${targetPhone}`);

    // 3. Buscar dados reais
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas')
      .select('*')
      .eq('id', cobranca_id)
      .single();
    if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);

    const { data: template, error: templateError } = await supabaseAdmin
      .from('templates')
      .select('conteudo')
      .eq('nome', template_name)
      .single();
    if (templateError) throw new Error(`Template '${template_name}' não encontrado: ${templateError.message}`);
    
    const { data: franqueadoData, error: rpcError } = await supabaseAdmin.rpc('get_franchisee_by_unit_code', {
      codigo_param: String(cobranca.codigo_unidade),
    });
    if (rpcError) throw new Error(`Erro ao buscar franqueado/unidade: ${rpcError.message}`);
    if (!franqueadoData || franqueadoData.length === 0) {
      throw new Error(`Nenhum franqueado principal encontrado para a unidade ${cobranca.codigo_unidade}`);
    }
    const franqueadoUnidadeInfo = franqueadoData[0];

    // 4. Mapear dados
    const unidadeInfo = {
        codigo_unidade: franqueadoUnidadeInfo.codigo_unidade,
        nome_padrao: franqueadoUnidadeInfo.nome_unidade
    };
    const franqueadoInfo = {
        nome: franqueadoUnidadeInfo.nome,
    };

    // 5. Preencher o template
    const message = template.conteudo
      .replace(new RegExp('{{franqueado.nome}}', 'g'), franqueadoInfo.nome)
      .replace(new RegExp('{{unidade.codigo_unidade}}', 'g'), String(unidadeInfo.codigo_unidade))
      .replace(new RegExp('{{cobranca.valor_atualizado}}', 'g'), cobranca.valor_atualizado.toFixed(2).replace('.', ','))
      .replace(new RegExp('{{cobranca.vencimento}}', 'g'), formatDate(cobranca.vencimento))
      .replace(new RegExp('{{cobranca.link_pagamento}}', 'g'), cobranca.link_pagamento || 'https://crescieperdi.com.br');
    
    // 6. Invocar a função de envio do Z-API
    const { data: zapiData, error: zapiError } = await supabaseAdmin.functions.invoke('zapi-send-text', {
      body: { phone: targetPhone, message },
    });

    if (zapiError) {
      throw new Error(`Erro na Z-API: ${zapiError.message}`);
    }
    
    // 7. Retornar sucesso
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Mensagem de teste enviada com sucesso.",
      sent_message: message,
      zapi_response: zapiData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("[Testar Template] ERRO FATAL:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});