// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Use built-in Deno.serve (recommended)
const ASAAS_API_URL = Deno.env.get('ASAAS_API_URL') || 'https://api-sandbox.asaas.com/v3';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
// Utility to safely JSON.stringify unknown values
function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch  {
    return String(obj);
  }
}
// Redact potential secrets in headers
function redactHeaders(h) {
  const out = {};
  if (!h) return out;
  const hdrs = new Headers(h);
  for (const [k, v] of hdrs.entries()){
    const lower = k.toLowerCase();
    if ([
      'authorization',
      'api-key',
      'access_token',
      'x-api-key'
    ].includes(lower)) {
      out[k] = '***redacted***';
    } else {
      out[k] = v;
    }
  }
  return out;
}
// Parse ASAAS response body as JSON if possible, otherwise text
async function parseAsaasBody(res) {
  const text = await res.text();
  if (!text) return {
    body: null,
    raw: null
  };
  try {
    return {
      body: JSON.parse(text),
      raw: text
    };
  } catch  {
    return {
      body: {
        _raw: text
      },
      raw: text
    };
  }
}
console.info('asaas-proxy initialized');
Deno.serve(async (req)=>{
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    console.warn('[asaas-proxy]', {
      requestId,
      msg: 'Method not allowed',
      method: req.method
    });
    return new Response(JSON.stringify({
      error: 'Method Not Allowed',
      requestId
    }), {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn('[asaas-proxy]', {
        requestId,
        msg: 'Invalid content type',
        contentType
      });
      return new Response(JSON.stringify({
        error: 'Invalid content type. Expected application/json',
        requestId
      }), {
        status: 415,
        headers: corsHeaders
      });
    }
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      console.error('[asaas-proxy] JSON parse error', {
        requestId,
        error: e instanceof Error ? e.message : String(e)
      });
      return new Response(JSON.stringify({
        error: 'Invalid JSON body',
        requestId
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      console.error('[asaas-proxy] Missing ASAAS_API_KEY', {
        requestId
      });
      return new Response(JSON.stringify({
        error: 'ASAAS_API_KEY is not configured',
        requestId
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
    const endpoint = String(payload?.endpoint || '').trim();
    const options = payload?.options ?? {};
    if (!endpoint || !endpoint.startsWith('/')) {
      console.warn('[asaas-proxy] Invalid endpoint', {
        requestId,
        endpoint
      });
      return new Response(JSON.stringify({
        error: 'Invalid endpoint. It must start with /',
        requestId
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const url = `${ASAAS_API_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});
    headers.set('access_token', asaasApiKey);
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    headers.set('User-Agent', 'Supabase-Edge-Function/asaas-proxy');
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body || undefined; // Cliente já fez JSON.stringify - não fazer novamente!
    
    console.info('[asaas-proxy] Outbound request', {
      requestId,
      method,
      url,
      headers: redactHeaders(headers),
      bodyPreviewBytes: typeof body === 'string' ? Math.min(body.length, 1024) : 0,
      bodyPreview: typeof body === 'string' ? body.substring(0, 300) : 'N/A' // Debug body
    });
    const asaasRes = await fetch(url, {
      method,
      headers,
      body
    });
    const { body: asaasBody, raw } = await parseAsaasBody(asaasRes);
    const durationMs = Date.now() - startedAt;
    if (!asaasRes.ok) {
      console.error('[asaas-proxy] ASAAS error', {
        requestId,
        status: asaasRes.status,
        statusText: asaasRes.statusText,
        durationMs,
        responseHeaders: redactHeaders(asaasRes.headers),
        responseBody: safeStringify(asaasBody)
      });
      return new Response(JSON.stringify({
        error: 'ASAAS API error',
        status: asaasRes.status,
        statusText: asaasRes.statusText,
        data: asaasBody,
        requestId
      }), {
        status: asaasRes.status,
        headers: {
          ...corsHeaders
        }
      });
    }
    console.info('[asaas-proxy] ASAAS success', {
      requestId,
      status: asaasRes.status,
      durationMs,
      responseHeaders: redactHeaders(asaasRes.headers),
      bodyPreviewBytes: raw ? Math.min(raw.length, 2048) : 0
    });
    return new Response(JSON.stringify(asaasBody), {
      status: 200,
      headers: {
        ...corsHeaders
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[asaas-proxy] Unexpected error', {
      requestId,
      message
    });
    return new Response(JSON.stringify({
      error: 'Unexpected error',
      message,
      requestId
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
