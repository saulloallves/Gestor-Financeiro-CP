-- ==============================================
-- CORREÇÃO: FUNÇÃO PARA GERAR CÓDIGO DE UNIDADE EM FORMATO DE 4 DÍGITOS
-- ==============================================

-- Substituir a função existente para gerar códigos no formato correto (0001, 0002, etc.)
CREATE OR REPLACE FUNCTION generate_next_unit_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
    next_code TEXT;
BEGIN
    -- Buscar o maior número atual (códigos de 4 dígitos: 0000-9999)
    SELECT COALESCE(
        MAX(CAST(codigo_unidade AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM unidades 
    WHERE codigo_unidade ~ '^\d{4}$';
    
    -- Garantir que está na faixa válida (0001-9999)
    IF next_number > 9999 THEN
        RAISE EXCEPTION 'Limite máximo de códigos de unidade atingido (9999)';
    END IF;
    
    -- Formatar como 4 dígitos com zeros à esquerda (0001, 0002, etc.)
    next_code := LPAD(next_number::TEXT, 4, '0');
    
    RETURN next_code;
END;
$$;

-- Manter as permissões
GRANT EXECUTE ON FUNCTION generate_next_unit_code() TO authenticated;
