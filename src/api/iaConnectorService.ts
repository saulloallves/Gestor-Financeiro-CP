import { supabase } from './supabaseClient';

class IaConnectorService {
  
  async gerarResposta(prompt: string, agentName: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('agente-chat-handler', {
        body: { prompt, agentName },
      });

      if (error) {
        throw new Error(`Erro na Edge Function: ${error.message}`);
      }

      if (data.error) {
        throw new Error(`Erro retornado pela IA: ${data.error}`);
      }

      return data.response || 'Não foi possível obter uma resposta.';
    } catch (error) {
      console.error("Erro ao gerar resposta da IA:", error);
      throw error;
    }
  }
}

export const iaConnectorService = new IaConnectorService();