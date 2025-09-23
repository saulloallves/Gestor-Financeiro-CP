-- Migration: Função para verificação de email que bypassa RLS
-- Data: 2025-09-05

-- Função para verificar se email já existe em qualquer tabela
CREATE OR REPLACE FUNCTION verificar_email_existe(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists_usuarios_internos BOOLEAN := FALSE;
    v_exists_franqueados BOOLEAN := FALSE;
    v_exists_auth_users BOOLEAN := FALSE;
BEGIN
    -- Verificar em usuarios_internos
    SELECT EXISTS (
        SELECT 1 FROM usuarios_internos 
        WHERE email = p_email
    ) INTO v_exists_usuarios_internos;

    -- Verificar em franqueados
    SELECT EXISTS (
        SELECT 1 FROM franqueados 
        WHERE email = p_email
    ) INTO v_exists_franqueados;

    -- Verificar em auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = p_email
    ) INTO v_exists_auth_users;

    RETURN json_build_object(
        'exists', (v_exists_usuarios_internos OR v_exists_franqueados OR v_exists_auth_users),
        'in_usuarios_internos', v_exists_usuarios_internos,
        'in_franqueados', v_exists_franqueados,
        'in_auth_users', v_exists_auth_users,
        'email', p_email
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'exists', false,
            'email', p_email
        );
END;
$$;

-- Comentário
COMMENT ON FUNCTION verificar_email_existe IS 
'Verifica se um email já existe em usuarios_internos, franqueados ou auth.users usando SECURITY DEFINER para bypassar RLS';

-- Garantir que authenticated users podem executar esta função
GRANT EXECUTE ON FUNCTION verificar_email_existe TO authenticated;
