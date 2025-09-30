import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

// Função para mapear status do ASAAS para o nosso sistema
const mapAsaasStatus = (asaasStatus: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'pendente',
    'RECEIVED': 'pago',
    'CONFIRMED': 'pago',
    'OVERDUE': 'vencido',
    'REFUNDED': 'cancelado',
    'RECEIVED_IN_CASH': 'pago',
    'AWAITING_CHARGEBACK_REVERSAL': 'pendente',
    'DUNNING_RECEIVED': 'pago',
    'AWAITING_RISK_ANALYSIS': 'pendente',
  };
  return statusMap[asaasStatus] || 'pendente';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let logId: string | null = null;

  try {
    // 1. Segurança: Validar o token do webhook
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const requestToken = req.headers.get('asaas-access-token');

    if (!webhookToken || requestToken !== webhookToken) {
      console.error('[Webhook ASAAS] ERRO: Token de autenticação inválido.');
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Obter e registrar o payload
    const payload = await req.json();
    const { event, payment } = payload;

    const { data: logData, error: logInsertError } = await supabaseAdmin
      .from('asaas_webhook_logs')
      .insert({
        event_type: event,
        payment_id: payment?.id,
        payload: payload,
        processing_status: 'received',
      })
      .select('id')
      .single();

    if (logInsertError) throw new Error(`Falha ao registrar log inicial: ${logInsertError.message}`);
    logId = logData.id;

    // 3. Processar o evento
    if (!payment || !payment.id) {
      throw new Error('Payload do webhook não contém um objeto de pagamento válido.');
    }

    const newStatus = mapAsaasStatus(payment.status);

    const { data: updatedCobranca, error: updateError } = await supabaseAdmin
      .from('cobrancas')
      .update({
        status: newStatus,
        valor_atualizado: payment.value,
        updated_at: new Date().toISOString(),
      })
      .eq('asaas_payment_id', payment.id)
      .select('id, codigo_unidade')
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // Not found
        throw new Error(`Cobrança com asaas_payment_id ${payment.id} não encontrada no banco de dados.`);
      }
      throw new Error(`Erro ao atualizar cobrança: ${updateError.message}`);
    }

    // 4. Notificar o frontend via Realtime
    const channel = supabaseAdmin.channel('cobrancas-updates');
    await channel.send({
      type: 'broadcast',
      event: 'cobranca-updated',
      payload: {
        id: updatedCobranca.id,
        status: newStatus,
        valor_atualizado: payment.value,
      },
    });

    // 5. Atualizar o log como processado com sucesso
    await supabaseAdmin
      .from('asaas_webhook_logs')
      .update({ is_processed: true, processing_status: 'success' })
      .eq('id', logId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Webhook ASAAS] ERRO FATAL:', error.message);
    
    // Se um log foi criado, atualiza com o erro
    if (logId) {
      await supabaseAdmin
        .from('asaas_webhook_logs')
        .update({ 
          is_processed: false, 
          processing_status: 'error',
          error_message: error.message 
        })
        .eq('id', logId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});