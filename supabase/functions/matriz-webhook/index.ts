import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

// =================================================================
// TIPOS E FUNÇÕES DE MAPEAMENTO (COPIADOS DE src/utils/matrizMappers.ts)
// =================================================================

// --- Tipos ---
interface UnidadeMatriz {
  id: string;
  group_name: string;
  group_code: number;
  phone?: string;
  email?: string;
  store_phase: string;
  address?: string;
  number_address?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  uf?: string;
  postal_code?: string;
  cnpj?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface FranqueadoMatriz {
  id: string;
  full_name: string;
  cpf_rnm: string;
  contact: string;
  email?: string;
  owner_type: string;
  is_active_system: boolean;
  created_at: string;
  updated_at: string;
}

// --- Funções de Mapeamento ---
function mapearStatusUnidade(storePhase: string): string {
  const phase = storePhase.toLowerCase();
  if (['operacao', 'operação', 'ativo'].includes(phase)) return 'OPERAÇÃO';
  if (['implantacao', 'implantação'].includes(phase)) return 'IMPLANTAÇÃO';
  if (['suspenso', 'pausado'].includes(phase)) return 'SUSPENSO';
  if (['cancelado', 'encerrado'].includes(phase)) return 'CANCELADO';
  return 'IMPLANTAÇÃO';
}

function mapearTipoFranqueado(ownerType: string): string {
  const type = ownerType.toLowerCase();
  if (['principal'].includes(type)) return 'principal';
  if (['sócio', 'socio', 'familiar'].includes(type)) return 'familiar';
  if (['investidor'].includes(type)) return 'investidor';
  if (['parceiro'].includes(type)) return 'parceiro';
  return 'principal';
}

function extrairTelefoneDoContato(contact: string): string {
  const semEmail = contact.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '');
  const match = semEmail.match(/[\d()-\s+]+/);
  return match ? match[0].replace(/[^\d+]/g, '') : '';
}

// =================================================================
// LÓGICA PRINCIPAL DA EDGE FUNCTION
// =================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { table, record } = payload;

    if (!table || !record) {
      throw new Error('Payload inválido: table e record são obrigatórios.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let rpcName = '';
    let rpcParams = {};

    if (table === 'unidades') {
      const unidadeMatriz = record as UnidadeMatriz;
      rpcName = 'upsert_unidade_from_matriz';
      rpcParams = {
        p_id: unidadeMatriz.id,
        p_codigo_unidade: String(unidadeMatriz.group_code),
        p_nome_padrao: unidadeMatriz.group_name,
        p_cnpj: unidadeMatriz.cnpj,
        p_status: mapearStatusUnidade(unidadeMatriz.store_phase),
        p_telefone_comercial: unidadeMatriz.phone,
        p_email_comercial: unidadeMatriz.email,
        p_endereco_rua: unidadeMatriz.address,
        p_endereco_numero: unidadeMatriz.number_address,
        p_endereco_complemento: unidadeMatriz.address_complement,
        p_endereco_bairro: unidadeMatriz.neighborhood,
        p_endereco_cidade: unidadeMatriz.city,
        p_endereco_estado: unidadeMatriz.state,
        p_endereco_uf: unidadeMatriz.uf,
        p_endereco_cep: unidadeMatriz.postal_code,
        p_created_at: unidadeMatriz.created_at,
        p_updated_at: unidadeMatriz.updated_at,
        p_raw_payload: record,
      };
    } else if (table === 'franqueados') {
      const franqueadoMatriz = record as FranqueadoMatriz;
      rpcName = 'upsert_franqueado_from_matriz';
      rpcParams = {
        p_id: franqueadoMatriz.id,
        p_nome: franqueadoMatriz.full_name,
        p_cpf: franqueadoMatriz.cpf_rnm,
        p_email: franqueadoMatriz.email,
        p_telefone: extrairTelefoneDoContato(franqueadoMatriz.contact),
        p_tipo: mapearTipoFranqueado(franqueadoMatriz.owner_type),
        p_status: franqueadoMatriz.is_active_system ? 'ativo' : 'inativo',
        p_created_at: franqueadoMatriz.created_at,
        p_updated_at: franqueadoMatriz.updated_at,
        p_raw_payload: record,
      };
    } else {
      throw new Error(`Tabela '${table}' não suportada para sincronização.`);
    }

    // Chamar a função RPC para fazer o UPSERT e a auditoria
    const { error: rpcError } = await supabaseAdmin.rpc(rpcName, rpcParams);
    if (rpcError) {
      console.error(`[matriz-webhook] Erro ao chamar RPC '${rpcName}':`, rpcError);
      throw new Error(`Erro na sincronização: ${rpcError.message}`);
    }

    // Transmitir um evento simples para notificar o frontend
    const channel = supabaseAdmin.channel('matriz-updates');
    await channel.send({
      type: 'broadcast',
      event: 'db-change',
      payload: {
        table: table,
        id: record.id,
        updated_at: record.updated_at,
      },
    });

    return new Response(JSON.stringify({ success: true, message: `Registro ${record.id} da tabela ${table} sincronizado.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[matriz-webhook] Erro:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});