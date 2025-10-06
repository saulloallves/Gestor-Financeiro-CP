CREATE OR REPLACE FUNCTION public.get_cobrancas_by_filter(
    p_codigo_unidade integer DEFAULT NULL,
    p_status text DEFAULT NULL
)
RETURNS SETOF public.cobrancas
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.cobrancas
    WHERE
        (p_codigo_unidade IS NULL OR codigo_unidade = p_codigo_unidade) AND
        (p_status IS NULL OR status = p_status)
    ORDER BY vencimento DESC
    LIMIT 10; -- Limite para evitar respostas muito longas
END;
$$;