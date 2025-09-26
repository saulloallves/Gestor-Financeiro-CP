-- Recria a função com a lógica de cálculo de juros corrigida
CREATE OR REPLACE FUNCTION public.atualizar_cobrancas_vencidas()
RETURNS void -- Alterado para void, pois a função apenas executa ações
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config record;
    v_cobranca record;
    v_dias_atraso integer;
    v_juros numeric;
    v_multa numeric;
    v_valor_atualizado numeric;
    v_updated_count integer := 0;
BEGIN
    -- 1. Busca as configurações de cobrança
    SELECT * INTO v_config FROM public.configuracoes LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Configurações de cobrança não encontradas na tabela public.configuracoes';
    END IF;

    -- 2. Itera sobre todas as cobranças vencidas que não estão pagas ou canceladas
    FOR v_cobranca IN
        SELECT * FROM public.cobrancas
        WHERE vencimento < CURRENT_DATE
          AND status NOT IN ('pago', 'cancelado')
    LOOP
        -- 3. Calcula os valores
        v_dias_atraso := CURRENT_DATE - v_cobranca.vencimento;
        
        -- A multa é aplicada uma única vez sobre o valor original
        v_multa := v_cobranca.valor_original * (v_config.valor_multa_atraso / 100.0);
        
        -- CORREÇÃO: Os juros também são uma porcentagem e devem ser divididos por 100
        v_juros := v_cobranca.valor_original * (v_config.taxa_juros_diaria / 100.0) * v_dias_atraso;
        
        -- Aplica o teto máximo para os juros acumulados
        v_juros := LEAST(v_juros, v_cobranca.valor_original * (v_config.maximo_juros_acumulado / 100.0));
        
        -- Calcula o valor final atualizado
        v_valor_atualizado := v_cobranca.valor_original + v_multa + v_juros;

        -- 4. Atualiza o registro da cobrança
        UPDATE public.cobrancas
        SET
            valor_atualizado = v_valor_atualizado,
            juros_aplicado = v_juros,
            multa_aplicada = v_multa,
            dias_atraso = v_dias_atraso,
            status = 'vencido', -- Garante que o status reflita a condição de atraso
            updated_at = now()
        WHERE id = v_cobranca.id;

        v_updated_count := v_updated_count + 1;
    END LOOP;

    -- 5. Envia uma mensagem de log para o banco de dados
    RAISE NOTICE 'Processo concluído. Total de cobranças vencidas atualizadas: %', v_updated_count;
END;
$$;