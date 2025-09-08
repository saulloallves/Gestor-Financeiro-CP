-- Correção emergencial para restaurar o login
-- Simplificar função get_internal_user_data temporariamente

-- ==============================================
-- CORREÇÃO EMERGENCIAL DE LOGIN
-- ==============================================

-- Dropar função quebrada
DROP FUNCTION IF EXISTS get_internal_user_data(UUID);

-- Recriar versão simplificada que funciona
CREATE OR REPLACE FUNCTION get_internal_user_data(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    perfil perfil_usuario_enum
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.user_id,
        ui.nome,
        ui.email,
        ui.telefone,
        ui.perfil
    FROM usuarios_internos ui
    WHERE ui.user_id = user_uuid;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_internal_user_data(UUID) TO authenticated;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON FUNCTION get_internal_user_data(UUID) IS 
'Função simplificada para buscar dados do usuário interno. Versão corrigida para restaurar login.';
