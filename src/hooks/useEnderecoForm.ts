/**
 * Hook customizado para integração com ViaCEP em formulários
 * Facilita o uso da API ViaCEP em formulários de endereço
 */

import { useCallback, useState } from "react";
import type { UseFormSetValue } from "react-hook-form";
import { useViaCep, type EnderecoData } from "../api/viaCepService";

interface UseEnderecoFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: UseFormSetValue<any>;
  cepFieldName?: string;
  ruaFieldName?: string;
  bairroFieldName?: string;
  cidadeFieldName?: string;
  estadoFieldName?: string;
  ufFieldName?: string;
  complementoFieldName?: string;
}

/**
 * Hook para facilitar a integração do ViaCEP em formulários
 * Auto-preenche campos de endereço baseado no CEP
 */
export function useEnderecoForm({
  setValue,
  cepFieldName = "cep",
  ruaFieldName = "rua",
  bairroFieldName = "bairro",
  cidadeFieldName = "cidade",
  estadoFieldName = "estado",
  ufFieldName = "uf",
  complementoFieldName = "complemento",
}: UseEnderecoFormProps) {
  const { loading, consultarCep, formatarCep, validarCep } = useViaCep();
  const [ultimoCepBuscado, setUltimoCepBuscado] = useState<string>("");

  /**
   * Busca CEP e auto-preenche os campos do formulário
   */
  const buscarEPreencherCep = useCallback(
    async (cep: string): Promise<EnderecoData | null> => {
      const cepLimpo = cep.replace(/\D/g, "");

      if (!validarCep(cepLimpo)) {
        return null;
      }

      // Evitar buscar o mesmo CEP consecutivamente
      if (ultimoCepBuscado === cepLimpo) {
        return null;
      }

      setUltimoCepBuscado(cepLimpo);

      const endereco = await consultarCep(cepLimpo);

      if (endereco) {
        // Auto-preencher os campos
        setValue(cepFieldName, formatarCep(endereco.cep));
        setValue(ruaFieldName, endereco.logradouro);
        setValue(bairroFieldName, endereco.bairro);
        setValue(cidadeFieldName, endereco.cidade);
        setValue(estadoFieldName, endereco.estado);
        setValue(ufFieldName, endereco.uf);

        // Preencher complemento se disponível
        if (endereco.complemento && complementoFieldName) {
          setValue(complementoFieldName, endereco.complemento);
        }
      }

      return endereco;
    },
    [
      setValue,
      consultarCep,
      formatarCep,
      validarCep,
      ultimoCepBuscado,
      cepFieldName,
      ruaFieldName,
      bairroFieldName,
      cidadeFieldName,
      estadoFieldName,
      ufFieldName,
      complementoFieldName,
    ]
  );

  /**
   * Handler para mudança no campo CEP
   * Formata o CEP e busca automaticamente quando completo
   */
  const handleCepChange = useCallback(
    (valor: string, onChange: (value: string) => void) => {
      const cepLimpo = valor.replace(/\D/g, "");
      const cepFormatado = formatarCep(cepLimpo);

      onChange(cepFormatado);

      // Buscar automaticamente quando CEP estiver completo
      if (cepLimpo.length === 8) {
        buscarEPreencherCep(cepLimpo);
      }
    },
    [formatarCep, buscarEPreencherCep]
  );

  /**
   * Handler para busca manual do CEP (ex: botão de buscar)
   */
  const handleBuscarCep = useCallback(
    (cep: string) => {
      const cepLimpo = cep.replace(/\D/g, "");
      if (cepLimpo.length === 8) {
        buscarEPreencherCep(cepLimpo);
      }
    },
    [buscarEPreencherCep]
  );

  /**
   * Limpa o cache do último CEP buscado
   */
  const limparCache = useCallback(() => {
    setUltimoCepBuscado("");
  }, []);

  return {
    loading,
    buscarEPreencherCep,
    handleCepChange,
    handleBuscarCep,
    limparCache,
    formatarCep,
    validarCep,
  };
}

// Re-exportar tipos e funções úteis para uso direto
export type { EnderecoData } from "../api/viaCepService";
export {
  buscarCep,
  buscarCepPorEndereco,
  formatarCep,
  limparCep,
  validarCep,
} from "../api/viaCepService";
