-- Recrear a função get_internal_user_data que estava ausente
-- Esta função é necessária para o login de usuários internos
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

-- Adicionar comentário para documentação
COMMENT ON FUNCTION get_internal_user_data(UUID) IS 'Função para buscar dados do usuário interno após login. Roda com SECURITY DEFINER para bypassar RLS.';
