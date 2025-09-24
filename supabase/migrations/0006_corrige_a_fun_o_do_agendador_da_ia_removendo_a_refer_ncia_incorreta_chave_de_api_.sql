-- Atualiza a função para invocar a Edge Function 'agente-financeiro' sem o header de autorização incorreto
CREATE OR REPLACE FUNCTION public.processar_cobrancas_autonomas()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cobranca_record RECORD;
    processadas_count INTEGER := 0;
    erros_count INTEGER := 0;
    error_details TEXT[] := '{}';
    request_id BIGINT;
    response JSONB;
BEGIN
    -- Seleciona cobranças que precisam de atenção (próximas do vencimento ou vencidas)
    FOR cobranca_record IN
        SELECT id FROM public.cobrancas
        WHERE status IN ('pendente', 'em_aberto', 'em_atraso', 'vencido')
        -- Limita a 50 por execução para não sobrecarregar o sistema
        LIMIT 50
    LOOP
        BEGIN
            -- Invoca a Edge Function 'agente-financeiro' para cada cobrança
            -- CORREÇÃO: Removido o header 'Authorization' que causava o erro.
            SELECT * INTO request_id FROM net.http_post(
                url := 'https://qrdewkryvpwvdxygtxve.supabase.co/functions/v1/agente-financeiro',
                body := jsonb_build_object('cobranca_id', cobranca_record.id),
                headers := jsonb_build_object('Content-Type', 'application/json')
            );

            -- Aguarda a resposta (com timeout de 15 segundos)
            SELECT * INTO response FROM net.http_collect_response(request_id, timeout_milliseconds := 15000);

            -- Verifica se a resposta indica um erro (status code não-2xx)
            IF (response->>'status_code')::INT >= 300 THEN
                erros_count := erros_count + 1;
                error_details := array_append(error_details, 'Cobrança ' || cobranca_record.id::text || ': ' || (response->'body'->>'error')::text);
            ELSE
                processadas_count := processadas_count + 1;
            END IF;

        EXCEPTION
            WHEN OTHERS THEN
                erros_count := erros_count + 1;
                error_details := array_append(error_details, 'Cobrança ' || cobranca_record.id::text || ': ' || SQLERRM);
        END;
    END LOOP;

    -- Retorna um resumo do que foi processado
    RETURN json_build_object(
        'success', erros_count = 0,
        'cobrancas_processadas', processadas_count,
        'erros', erros_count,
        'detalhes_erros', error_details,
        'timestamp', NOW()
    );
END;
$$;