import type { IAProvider } from '../types/ia';

// Interfaces para as respostas das APIs
interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  data: OpenAIModel[];
  object: string;
}

// Interface unificada para modelos
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

class AIProvidersService {
  /**
   * Buscar modelos disponíveis da OpenAI
   */
  async fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro da OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data: OpenAIModelsResponse = await response.json();
      
      // Filtrar apenas modelos relevantes (GPT models)
      const relevantModels = data.data.filter(model => 
        model.id.includes('gpt') && 
        !model.id.includes('instruct') && // Excluir modelos instruct descontinuados
        !model.id.includes('edit') && // Excluir modelos de edição
        !model.id.includes('search') // Excluir modelos de busca
      );

      return relevantModels
        .map(model => ({
          id: model.id,
          name: model.id,
          description: `Modelo ${model.id} da OpenAI`,
        }))
        .sort((a, b) => {
          // Priorizar GPT-4 sobre GPT-3.5
          if (a.id.includes('gpt-4') && !b.id.includes('gpt-4')) return -1;
          if (!a.id.includes('gpt-4') && b.id.includes('gpt-4')) return 1;
          return a.id.localeCompare(b.id);
        });
    } catch (error) {
      console.error('Erro ao buscar modelos da OpenAI:', error);
      throw new Error(`Falha ao conectar com OpenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Buscar modelos disponíveis da Anthropic (Claude)
   * Nota: A Anthropic não tem um endpoint público para listar modelos
   * Retorna uma lista estática dos modelos conhecidos
   */
  async fetchAnthropicModels(_apiKey: string): Promise<ModelInfo[]> {
    // A Anthropic não oferece um endpoint público para listar modelos
    // Retornamos uma lista estática dos modelos disponíveis
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Modelo mais avançado da Anthropic com raciocínio superior',
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Modelo mais poderoso para tarefas complexas',
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Equilibrio entre performance e velocidade',
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Modelo mais rápido para tarefas simples',
      },
    ];
  }

  /**
   * Buscar modelos de qualquer provedor
   */
  async fetchModels(provider: IAProvider, apiKey: string): Promise<ModelInfo[]> {
    switch (provider) {
      case 'openai':
        return this.fetchOpenAIModels(apiKey);
      case 'lambda':
        return this.fetchAnthropicModels(apiKey);
      default:
        throw new Error(`Provedor não suportado: ${provider}`);
    }
  }

  /**
   * Testar conexão com a API do provedor
   */
  async testConnection(provider: IAProvider, apiKey: string): Promise<boolean> {
    try {
      const models = await this.fetchModels(provider, apiKey);
      return models.length > 0;
    } catch (error) {
      console.error(`Erro ao testar conexão com ${provider}:`, error);
      return false;
    }
  }
}

export const aiProvidersService = new AIProvidersService();