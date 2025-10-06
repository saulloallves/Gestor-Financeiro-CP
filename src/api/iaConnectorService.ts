import { supabase } from './supabaseClient';

interface GerarRespostaResponse {
  response: string;
  chatId: string;
}

class IaConnectorService {
  async gerarResposta(prompt: string, agentName: string, chatId: string | null): Promise<GerarRespostaResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('agente-chat-handler', {
        body: { prompt, agentName, chatId },
      });

      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (data.error) {
        throw new Error(`Erro retornado pela IA: ${data.error}`);
      }

      return data;
    } catch (error) {
      console.error("Erro ao gerar resposta da IA:", error);
      throw error;
    }
  }
}

export const iaConnectorService = new IaConnectorService();