/**
 * Componente para exibir e editar código de unidade
 * Segue o padrão da Cresci e Perdi: códigos únicos de 4 dígitos
 */

import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Hash, RefreshCw, Check, X } from "lucide-react";
import {
  validarCodigoUnidade,
  formatarCodigoUnidade,
} from "../utils/validations";
import { supabase } from "../api/supabaseClient";
import { toast } from "react-hot-toast";

interface CodigoUnidadeProps {
  codigo?: string;
  isEditing?: boolean;
  onCodigoChange?: (codigo: string) => void;
  disabled?: boolean;
}

export function CodigoUnidade({
  codigo,
  isEditing = false,
  onCodigoChange,
  disabled = false,
}: CodigoUnidadeProps) {
  const theme = useTheme();
  const [isEditingCodigo, setIsEditingCodigo] = useState(false);
  const [tempCodigo, setTempCodigo] = useState(codigo || "");
  const [isValidating, setIsValidating] = useState(false);

  /**
   * Verifica se um código está disponível no banco
   */
  const verificarDisponibilidade = async (
    novoCodigo: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("unidades")
        .select("codigo_unidade")
        .eq("codigo_unidade", novoCodigo)
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar código:", error);
        return false;
      }

      return !data; // Retorna true se não encontrou (código disponível)
    } catch (error) {
      console.error("Erro na verificação:", error);
      return false;
    }
  };

  /**
   * Gera um novo código aleatório
   */
  const gerarCodigoAleatorio = async () => {
    setIsValidating(true);

    try {
      // Tentar até 10 vezes gerar um código único
      for (let i = 0; i < 10; i++) {
        const novoCodigo = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        const disponivel = await verificarDisponibilidade(novoCodigo);

        if (disponivel) {
          setTempCodigo(novoCodigo);
          if (onCodigoChange) {
            onCodigoChange(novoCodigo);
          }
          toast.success(`Código ${novoCodigo} gerado com sucesso!`);
          return;
        }
      }

      toast.error("Não foi possível gerar um código único. Tente novamente.");
    } catch (error) {
      console.error("Erro ao gerar código:", error);
      toast.error("Erro ao gerar código. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Confirma a edição do código
   */
  const confirmarEdicao = async () => {
    const codigoFormatado = formatarCodigoUnidade(tempCodigo);

    if (!validarCodigoUnidade(codigoFormatado)) {
      toast.error("Código deve ter exatamente 4 dígitos (0000-9999)");
      return;
    }

    // Se não mudou o código, só fechar a edição
    if (codigoFormatado === codigo) {
      setIsEditingCodigo(false);
      return;
    }

    setIsValidating(true);

    try {
      const disponivel = await verificarDisponibilidade(codigoFormatado);

      if (!disponivel) {
        toast.error(
          `Código ${codigoFormatado} já está em uso por outra unidade`
        );
        return;
      }

      if (onCodigoChange) {
        onCodigoChange(codigoFormatado);
      }

      setIsEditingCodigo(false);
      toast.success(`Código alterado para ${codigoFormatado}`);
    } catch (error) {
      console.error("Erro ao validar código:", error);
      toast.error("Erro ao validar código. Tente novamente.");
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Cancela a edição
   */
  const cancelarEdicao = () => {
    setTempCodigo(codigo || "");
    setIsEditingCodigo(false);
  };

  // Se não está editando (criação), mostrar apenas o status
  if (!isEditing) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Hash size={20} color={theme.palette.primary.main} />
        {codigo ? (
          <Chip
            label={`Código: ${codigo}`}
            size="small"
            sx={{
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              fontWeight: "bold",
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Código será gerado automaticamente
          </Typography>
        )}
      </Box>
    );
  }

  // Modo de edição de código
  if (isEditingCodigo) {
    return (
      <Box sx={{ display: "flex", flex: 1, gap: 2, alignItems: "flex-start" }}>
        <TextField
          value={tempCodigo}
          onChange={(e) => {
            const valor = e.target.value.replace(/\D/g, "").substring(0, 4);
            setTempCodigo(valor.padStart(Math.min(valor.length, 4), "0"));
          }}
          placeholder="0000"
          size="small"
          inputProps={{
            maxLength: 4,
            style: {
              textAlign: "center",
              fontFamily: "monospace",
              fontSize: "16px",
            },
          }}
          sx={{ width: 80 }}
          disabled={disabled || isValidating}
        />

        <Button
          size="small"
          variant="outlined"
          startIcon={
            isValidating ? <CircularProgress size={16} /> : <Check size={16} />
          }
          onClick={confirmarEdicao}
          disabled={disabled || isValidating}
        >
          {isValidating ? "Validando..." : "Confirmar"}
        </Button>

        <Button
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<X size={16} />}
          onClick={cancelarEdicao}
          disabled={disabled || isValidating}
        >
          Cancelar
        </Button>
      </Box>
    );
  }

  // Modo de exibição com opção de editar
  return (
    <Box sx={{ display: "flex", flex: 1, gap: 2, alignItems: "center" }}>
      <Hash size={20} color={theme.palette.primary.main} />

      {codigo ? (
        <Chip
          label={`Código: ${codigo}`}
          size="small"
          sx={{
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            fontWeight: "bold",
          }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          Será gerado automaticamente
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Tooltip title="Gerar código aleatório">
          <Button
            size="small"
            variant="outlined"
            startIcon={
              isValidating ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshCw size={16} />
              )
            }
            onClick={gerarCodigoAleatorio}
            disabled={disabled || isValidating}
          >
            Gerar
          </Button>
        </Tooltip>

        <Tooltip title="Editar código manualmente">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Hash size={16} />}
            onClick={() => {
              setTempCodigo(codigo || "");
              setIsEditingCodigo(true);
            }}
            disabled={disabled || isValidating}
          >
            Editar
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default CodigoUnidade;
