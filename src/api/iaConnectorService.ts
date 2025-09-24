import { configuracoesService } from './configuracoesService';
import { iaService } from './iaService';

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
            choices: [{ message: { content: `Resposta simulada para: "${messages.find(m => m.role === 'user')?.content}"` } }]
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
      
      if (!config.ia_prompt_base) {
        throw new Error('Prompt base da IA não configurado.');
      }

      // Passo 1: Consultar a base de conhecimento (Retrieval)
      const contexto = await iaService.consultarBase(prompt);
      
      // Passo 2: Montar o prompt final combinando o prompt base, o contexto e a pergunta do usuário
      const contextoFormatado = contexto.length > 0
        ? contexto
            .map(c => `Título: ${c.titulo}\nConteúdo: ${c.conteudo}`)
            .join('\n\n---\n\n')
        : "Nenhuma informação encontrada na base de conhecimento para esta pergunta.";

      const promptFinal = `${config.ia_prompt_base}

# Contexto Relevante da Base de Conhecimento
---
${contextoFormatado}
---

# Pergunta do Usuário
Com base nas suas regras e no contexto acima, responda à seguinte pergunta:
"${prompt}"`;

      console.log("🤖 Prompt Final Enviado para a IA:", promptFinal);

      // Passo 3: Chamar o provedor de IA com o prompt final (Generation)
      switch (config.ia_provedor) {
        case 'openai':
          return this.chamarOpenAI(promptFinal, config.ia_modelo, config.ia_api_key);
        
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