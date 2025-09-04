-- Função para buscar email de usuário por ID (bypassa RLS)
-- Necessária para o login de franqueados
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_uuid;
    
    RETURN user_email;
END;
$$;

-- Concede permissão para usuários anônimos (login ainda não feito)
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;
