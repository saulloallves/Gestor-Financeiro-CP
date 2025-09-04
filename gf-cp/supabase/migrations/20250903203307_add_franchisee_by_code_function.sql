-- Função para buscar franqueado por código (bypassa RLS)
-- Essa função é necessária para o login de franqueados
CREATE OR REPLACE FUNCTION get_franchisee_by_code(codigo TEXT)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    codigo_franquia TEXT,
    nome_fantasia TEXT,
    user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nome,
        f.codigo_franquia,
        f.nome_fantasia,
        f.user_id
    FROM franqueados f
    WHERE f.codigo_franquia = codigo;
END;
$$;

-- Concede permissão para usuários autenticados (mesmo não logados ainda)
GRANT EXECUTE ON FUNCTION get_franchisee_by_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_franchisee_by_code(TEXT) TO authenticated;
