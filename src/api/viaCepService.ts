/**
 * Serviço de integração com a API ViaCEP
 * Documentação: https://viacep.com.br/
 */

import { useState } from 'react';
import { toast } from 'react-hot-toast';

// Interface para o retorno da API ViaCEP
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  unidade: string;
  bairro: string;
  localidade: string;
  uf: string;
  estado: string;
  regiao: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean; // Presente quando CEP não encontrado
}

// Interface para dados de endereço padronizado para uso na aplicação
export interface EnderecoData {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  estado: string;
}

/**
 * Valida se o CEP está no formato correto (8 dígitos)
 */
export function validarCep(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, '');
  return /^[0-9]{8}$/.test(cepLimpo);
}

/**
 * Formata o CEP para exibição (12345-678)
 */
export function formatarCep(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Remove formatação do CEP, deixando apenas os dígitos
 */
export function limparCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

/**
 * Busca dados do CEP na API ViaCEP
 */
export async function buscarCep(cep: string): Promise<EnderecoData | null> {
  try {
    const cepLimpo = limparCep(cep);
    
    // Validar formato do CEP antes de fazer a requisição
    if (!validarCep(cepLimpo)) {
      toast.error('CEP deve conter 8 dígitos');
      return null;
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data: ViaCepResponse = await response.json();

    // Verificar se o CEP foi encontrado
    if (data.erro) {
      toast.error('CEP não encontrado');
      return null;
    }

    // Converter para o formato padronizado da aplicação
    const enderecoData: EnderecoData = {
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento || undefined,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
      estado: data.estado
    };

    return enderecoData;

  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    toast.error('Erro ao consultar CEP. Tente novamente.');
    return null;
  }
}

/**
 * Busca CEPs por endereço (pesquisa reversa)
 * Requer UF, cidade e logradouro (mínimo 3 caracteres cada)
 */
export async function buscarCepPorEndereco(
  uf: string,
  cidade: string,
  logradouro: string
): Promise<ViaCepResponse[] | null> {
  try {
    // Validar parâmetros mínimos
    if (uf.length < 2) {
      toast.error('UF deve ter 2 caracteres');
      return null;
    }
    
    if (cidade.length < 3) {
      toast.error('Cidade deve ter pelo menos 3 caracteres');
      return null;
    }
    
    if (logradouro.length < 3) {
      toast.error('Logradouro deve ter pelo menos 3 caracteres');
      return null;
    }

    const url = `https://viacep.com.br/ws/${encodeURIComponent(uf)}/${encodeURIComponent(cidade)}/${encodeURIComponent(logradouro)}/json/`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data: ViaCepResponse[] = await response.json();

    if (Array.isArray(data) && data.length === 0) {
      toast.error('Nenhum CEP encontrado para este endereço');
      return null;
    }

    return data;

  } catch (error) {
    console.error('Erro ao buscar CEP por endereço:', error);
    toast.error('Erro ao consultar endereço. Tente novamente.');
    return null;
  }
}

/**
 * Hook personalizado para facilitar o uso do ViaCEP em formulários
 */
export function useViaCep() {
  const [loading, setLoading] = useState(false);

  const consultarCep = async (cep: string): Promise<EnderecoData | null> => {
    setLoading(true);
    try {
      const resultado = await buscarCep(cep);
      return resultado;
    } finally {
      setLoading(false);
    }
  };

  const consultarEndereco = async (
    uf: string,
    cidade: string,
    logradouro: string
  ): Promise<ViaCepResponse[] | null> => {
    setLoading(true);
    try {
      const resultado = await buscarCepPorEndereco(uf, cidade, logradouro);
      return resultado;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    consultarCep,
    consultarEndereco,
    validarCep,
    formatarCep,
    limparCep
  };
}
