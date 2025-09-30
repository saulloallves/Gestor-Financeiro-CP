import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

// Mapeamento de status mais completo
const mapAsaasStatus = (asaasStatus: string): string | null => {
  const statusMap: Record<string, string> = {
    // Pagos
    'RECEIVED': 'pago',
    'CONFIRMED': 'pago',
    'RECEIVED_IN_CASH': 'pago',
    'DUNNING_RECEIVED': 'pago',
    // Pendentes
    'PENDING': 'pendente',
    'AWAITING_RISK_ANALYSIS': 'pendente',
    'AWAITING_CHARGEBACK_REVERSAL': 'pendente',
    'RECEIVED_IN_CASH_UNDONE': 'pendente',
    // Vencidos
    'OVERDUE': 'vencido',
    // Cancelados/Falhados
    'DELETED': 'cancelado',
    'REFUNDED': 'cancelado',
    'REFUND_IN_PROGRESS': 'cancelado',
    'CHARGEBACK_REQUESTED': 'cancelado',
    'REPROVED_BY_RISK_ANALYSIS': 'cancelado',
  };
  return statusMap[asaasStatus] || null;
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
    // 1. Segurança: Validar o token
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const requestToken = req.headers.get('asaas-access-token');
    if (!webhookToken || requestToken !== webhookToken) {
      throw new Error('Acesso não autorizado: token de webhook inválido.');
    }

    // 2. Registrar o payload
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

    if (logInsertError) throw new Error(`Falha ao registrar log: ${logInsertError.message}`);
    logId = logData.id;

    if (!payment || !payment.id) {
      throw new Error('Payload não contém um objeto de pagamento válido.');
    }

    // 3. Lógica de processamento baseada no evento
    const updateData: { [key: string]: any } = { updated_at: new Date().toISOString() };
    let actionTaken = false;

    switch (event) {
      case 'PAYMENT_UPDATED':
        updateData.valor_atualizado = payment.value;
        updateData.vencimento = payment.dueDate;
        // O status também pode mudar em uma atualização
        const updatedStatus = mapAsaasStatus(payment.status);
        if (updatedStatus) updateData.status = updatedStatus;
        actionTaken = true;
        break;

      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_RESTORED':
        const newStatus = mapAsaasStatus(payment.status);
        if (newStatus) {
          updateData.status = newStatus;
          actionTaken = true;
        }
        break;
      
      // Para outros eventos, não fazemos nada na tabela de cobranças, apenas logamos.
      default:
        actionTaken = false;
        break;
    }

    if (actionTaken) {
      const { data: updatedCobranca, error: updateError } = await supabaseAdmin
        .from('cobrancas')
        .update(updateData)
        .eq('asaas_payment_id', payment.id)
        .select('id, codigo_unidade')
        .single();

      if (updateError) {
        if (updateError.code === 'PGRST116') { // Not found
          throw new Error(`Cobrança com asaas_payment_id ${payment.id} não encontrada.`);
        }
        throw new Error(`Erro ao atualizar cobrança: ${updateError.message}`);
      }

      // Notificar o frontend via Realtime
      const channel = supabaseAdmin.channel('cobrancas-updates');
      await channel.send({
        type: 'broadcast',
        event: 'cobranca-updated',
        payload: {
          id: updatedCobranca.id,
          ...updateData
        },
      });

      await supabaseAdmin
        .from('asaas_webhook_logs')
        .update({ is_processed: true, processing_status: 'success' })
        .eq('id', logId);
    } else {
      // Marcar o log como processado mas ignorado
      await supabaseAdmin
        .from('asaas_webhook_logs')
        .update({ is_processed: true, processing_status: 'processed_ignored' })
        .eq('id', logId);
    }

    return new Response(JSON.stringify({ success: true, actionTaken }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Webhook ASAAS] ERRO FATAL:', error.message);
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