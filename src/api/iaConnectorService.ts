import { configuracoesService } from './configuracoesService';

// Este é um placeholder para a biblioteca da OpenAI
// Em um projeto real, instalaríamos com `npm install openai`
const OpenAI = ({ apiKey }: { apiKey: string }) => {
  return {
    chat: {
      completions: {
        create: async ({ model, messages }: { model: string, messages: { role: string, content: string }[] }) => {
          console.log('Chamando OpenAI (simulado)', { model, messages, apiKey });
          // Simula uma resposta da API
          return Promise.resolve({
            choices: [{ message: { content: `Resposta simulada para: "${messages[messages.length - 1].content}"` } }]
          });
        }
      }
    }
  };
};


class IaConnectorService {
  
  async gerarResposta(prompt: string): Promise<string> {
    try {
      const config = await configuracoesService.obterConfiguracao();
      
      if (!config.ia_api_key) {
        throw new Error('Chave de API da IA não configurada.');
      }

      switch (config.ia_provedor) {
        case 'openai':
          return this.chamarOpenAI(prompt, config.ia_modelo, config.ia_api_key);
        
        // Futuramente, outros provedores podem ser adicionados aqui
        // case 'lambda':
        //   return this.chamarLambda(prompt, config.ia_modelo, config.ia_api_key);
        
        default:
          throw new Error(`Provedor de IA '${config.ia_provedor}' não suportado.`);
      }
    } catch (error) {
      console.error("Erro ao gerar resposta da IA:", error);
      throw error;
    }
  }

  private async chamarOpenAI(prompt: string, modelo: string, apiKey: string): Promise<string> {
    const openai = OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: modelo,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content ?? 'Não foi possível obter uma resposta.';
  }
}

export const iaConnectorService = new IaConnectorService();
