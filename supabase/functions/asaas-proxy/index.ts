// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Headers para permitir requisições do nosso app (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, restrinja para o seu domínio: 'https://meu-app.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL base da API do ASAAS
const ASAAS_API_URL = 'https://api-sandbox.asaas.com/v3';

serve(async (req) => {
  // Trata a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Iniciando a função asaas-proxy.');

    // 1. Pega a chave da API dos secrets do Supabase
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY não foi configurada nos secrets do Supabase.');
    }
    console.log('Chave da API do ASAAS carregada com sucesso.');

    // 2. Extrai o endpoint e o corpo da requisição original
    const body = await req.json();
    const { endpoint, options } = body;
    if (!endpoint) {
      throw new Error('O "endpoint" não foi fornecido no corpo da requisição.');
    }
    console.log(`Endpoint recebido: ${endpoint}`);
    console.log('Opções recebidas:', options);

    // 3. Monta a URL final para a API do ASAAS
    const url = `${ASAAS_API_URL}${endpoint}`;
    console.log(`URL final da requisição: ${url}`);

    // 4. Prepara os headers, injetando a chave da API
    const headers = new Headers(options?.headers || {});
    headers.set('access_token', asaasApiKey);
    headers.set('Content-Type', 'application/json');
    headers.set('User-Agent', 'Supabase-Edge-Function/1.0');

    // 5. Faz a requisição para a API do ASAAS
    console.log('Realizando a chamada fetch para o ASAAS...');
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    console.log(`Resposta do ASAAS recebida com status: ${response.status}`);

    // 6. Retorna a resposta (ou o erro) do ASAAS para o cliente
    const responseData = await response.json();

    if (!response.ok) {
      // Se a resposta do ASAAS for um erro, repassa o erro
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Se qualquer erro ocorrer no processo, retorna um erro 500 detalhado
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/asaas-proxy' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
