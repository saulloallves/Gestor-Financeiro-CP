import { supabase } from './supabaseClient';
import { limparNumeros } from '../utils/validations';

export type SendWhatsAppTextPayload = {
  phone: string; // número no formato internacional, ex: 5511999999999
  message: string;
};

export type SendWhatsAppTextResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
  status?: number;
};

type SupabaseFnError = { message: string; name?: string; status?: number };

export async function sendWhatsAppText(payload: SendWhatsAppTextPayload): Promise<SendWhatsAppTextResponse> {
  const phoneRaw = limparNumeros(payload.phone);
  const normalized = phoneRaw.startsWith('55') ? phoneRaw : `55${phoneRaw}`;

  const { data, error } = await supabase.functions.invoke('zapi-send-text', {
    body: { phone: normalized, message: payload.message },
  });

  if (error) {
  const e = error as SupabaseFnError;
  return { success: false, error: e.message, status: e.status };
  }
  return { success: true, data };
}
