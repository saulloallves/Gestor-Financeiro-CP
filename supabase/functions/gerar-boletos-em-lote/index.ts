import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper para buscar customer no ASAAS
async function findOrCreateAsaasCustomer(asaasApiKey: string, customerData: any) {
  const findUrl = `https://api-sandbox.asaas.com/v3/customers?cpfCnpj=${customerData.cpfCnpj}`;
  const findRes = await fetch(findUrl, {
    headers: { 'access_token': asaasApiKey }
  });
  const findData = await findRes.json();

  if (findData.data && findData.data.length > 0) {
    return { customer: findData.data[0], isNew: false };
  }

  const createUrl = `https://api-sandbox.asaas.com/v3/customers`;
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
    body: JSON.stringify(customerData),
  });
  const newCustomer = await createRes.json();
  if (!createRes.ok) throw new Error(newCustomer.errors?.[0]?.description || 'Erro ao criar cliente ASAAS');
  
  return { customer: newCustomer, isNew: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('Nenhum ID de cobrança fornecido.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) throw new Error('Chave da API ASAAS não configurada.');

    const results = {
      success: 0,
      skipped: 0,
      failures: [],
    };

    for (const id of ids) {
      try {
        // 1. Buscar dados da cobrança
        const { data: cobranca, error: cobrancaError } = await supabaseAdmin
          .from('cobrancas')
          .select('*, unidades(*)')
          .eq('id', id)
          .single();
        
        if (cobrancaError) throw new Error(`Cobrança não encontrada: ${cobrancaError.message}`);
        if (cobranca.asaas_payment_id) {
          results.skipped++;
          continue;
        }

        // 2. Preparar dados do cliente (usando CNPJ da unidade)
        const unidade = cobranca.unidades;
        if (!unidade || !unidade.cnpj) {
          throw new Error('Dados da unidade ou CNPJ não encontrados.');
        }

        const customerData = {
          name: unidade.nome_padrao,
          cpfCnpj: unidade.cnpj,
          email: unidade.email_comercial,
          phone: unidade.telefone_comercial,
        };

        // 3. Buscar ou criar cliente no ASAAS
        const { customer } = await findOrCreateAsaasCustomer(asaasApiKey, customerData);

        // 4. Criar pagamento no ASAAS
        const paymentData = {
          customer: customer.id,
          billingType: 'BOLETO',
          value: cobranca.valor_original,
          dueDate: cobranca.vencimento,
          description: cobranca.observacoes || `Cobrança de ${cobranca.tipo_cobranca}`,
        };
        
        const paymentRes = await fetch('https://api-sandbox.asaas.com/v3/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
          body: JSON.stringify(paymentData),
        });
        const payment = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(payment.errors?.[0]?.description || 'Erro ao criar pagamento ASAAS');

        // 5. Atualizar cobrança local
        const { error: updateError } = await supabaseAdmin
          .from('cobrancas')
          .update({
            asaas_payment_id: payment.id,
            asaas_customer_id: customer.id,
            link_boleto: payment.bankSlipUrl,
            link_pagamento: payment.invoiceUrl,
            status: 'pendente',
          })
          .eq('id', id);

        if (updateError) throw new Error(`Erro ao atualizar banco de dados: ${updateError.message}`);
        
        results.success++;
      } catch (error) {
        results.failures.push({
          id,
          codigo_unidade: (error as any).cobranca?.codigo_unidade || 0,
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});