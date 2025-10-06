import { supabase } from './supabaseClient';
import { configuracoesService } from './configuracoesService';
import { iaService } from './iaService';
import OpenAI from 'openai';

class IaConnectorService {
  
  async gerarResposta(prompt: string, agentName: string): Promise<string> {
    try {
      // Passo 1: Obter configurações globais (API Key, Provedor)
      const config = await configuracoesService.obterConfiguracao();
      if (!config.ia_api_key) {
        throw new Error('Chave de API da IA não configurada.');
      }

      // Passo 2: Obter o prompt base específico do agente
      const { data: promptData, error: promptError } = await supabase
        .from('ia_prompts')
        .select('prompt_base, modelo_ia')
        .eq('nome_agente', agentName)
        .single();

      if (promptError || !promptData || !promptData.prompt_base) {
        throw new Error(`Prompt para o agente '${agentName}' não foi encontrado ou está vazio.`);
      }

      // Passo 3: Consultar a base de conhecimento (Retrieval)
      const contexto = await iaService.consultarBase(prompt);
      
      // Passo 4: Montar o prompt final
      const contextoFormatado = contexto.length > 0
        ? contexto
            .map(c => `Título: ${c.titulo}\nConteúdo: ${c.conteudo}`)
            .join('\n\n---\n\n')
        : "Nenhuma informação encontrada na base de conhecimento para esta pergunta.";

      const promptFinal = `${promptData.prompt_base}

# Contexto Relevante da Base de Conhecimento
---
${contextoFormatado}
---

# Pergunta do Usuário
Com base nas suas regras e no contexto acima, responda à seguinte pergunta:
"${prompt}"`;

      console.log(`🤖 Prompt Final Enviado para a IA (Agente: ${agentName}):`, promptFinal);

      // Passo 5: Chamar o provedor de IA com o prompt final
      switch (config.ia_provedor) {
        case 'openai':
          return this.chamarOpenAI(promptFinal, promptData.modelo_ia, config.ia_api_key);
        
        // Futuramente, outros provedores podem ser adicionados aqui
        // case 'lambda':
        //   return this.chamarLambda(prompt, promptData.modelo_ia, config.ia_api_key);
        
        default:
          throw new Error(`Provedor de IA '${config.ia_provedor}' não suportado.`);
      }
    } catch (error) {
      console.error("Erro ao gerar resposta da IA:", error);
      throw error;
    }
  }

  private async chamarOpenAI(prompt: string, modelo: string, apiKey: string): Promise<string> {
    const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

    const response = await openai.chat.completions.create({
      model: modelo,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message.content ?? 'Não foi possível obter uma resposta.';
  }
}

export const iaConnectorService = new IaConnectorService();