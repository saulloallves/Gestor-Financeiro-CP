import { supabaseAdmin } from './supabaseClient';

interface PublishEventParams {
  topic: string;
  payload: unknown;
}

/**
 * Publica um evento para a Edge Function 'webhook-dispatcher'.
 * Esta função centraliza a lógica de notificação de eventos de negócio
 * para que o dispatcher possa distribuí-los aos assinantes (webhooks).
 *
 * @param {PublishEventParams} params - Os parâmetros do evento.
 * @param {string} params.topic - O tópico do evento (ex: 'unidades.update').
 * @param {unknown} params.payload - Os dados do evento a serem enviados.
 */
export async function publishEvent({ topic, payload }: PublishEventParams): Promise<void> {
  const { error } = await supabaseAdmin.functions.invoke('webhook-dispatcher', {
    body: { topic, payload },
  });

  if (error) {
    console.error(`[EventService] Erro ao publicar evento para o tópico "${topic}":`, error);
    // Em um ambiente de produção, aqui seria um bom lugar para
    // implementar um sistema de retries (ex: com exponential backoff)
    // e logging estruturado (ex: para o Supabase Logs).
    throw new Error(`Falha ao invocar o webhook-dispatcher: ${error.message}`);
  }

  console.log(`[EventService] Evento publicado com sucesso para o tópico: "${topic}"`);
}
