-- Função para buscar dados do usuário interno após login
-- Esta função roda com privilégios elevados e bypassa RLS
CREATE OR REPLACE FUNCTION get_internal_user_data(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    email TEXT,
    perfil perfil_usuario
)
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios do owner (bypassa RLS)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.nome,
        ui.email,
        ui.perfil
    FROM usuarios_internos ui
    WHERE ui.user_id = user_uuid;
END;
$$;

-- Concede permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION get_internal_user_data(UUID) TO authenticated;

-- Função similar para franqueados
CREATE OR REPLACE FUNCTION get_franchisee_user_data(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    codigo_franquia TEXT,
    nome_fantasia TEXT
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
        f.nome_fantasia
    FROM franqueados f
    WHERE f.user_id = user_uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION get_franchisee_user_data(UUID) TO authenticated;
