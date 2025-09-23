-- Migration: Função para listar emails cadastrados que bypassa RLS
-- Data: 2025-09-05

-- Função para listar todos os emails cadastrados no sistema
CREATE OR REPLACE FUNCTION listar_emails_cadastrados()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emails_usuarios_internos TEXT[];
    v_emails_franqueados TEXT[];
    v_emails_auth_users TEXT[];
    v_all_emails TEXT[];
BEGIN
    -- Buscar emails de usuarios_internos
    SELECT ARRAY_AGG(email) 
    FROM usuarios_internos 
    WHERE email IS NOT NULL
    INTO v_emails_usuarios_internos;

    -- Buscar emails de franqueados
    SELECT ARRAY_AGG(email) 
    FROM franqueados 
    WHERE email IS NOT NULL
    INTO v_emails_franqueados;

    -- Buscar emails de auth.users
    SELECT ARRAY_AGG(email) 
    FROM auth.users 
    WHERE email IS NOT NULL
    INTO v_emails_auth_users;

    -- Unir todos os emails e remover duplicatas
    v_all_emails := ARRAY(
        SELECT DISTINCT unnest(
            COALESCE(v_emails_usuarios_internos, '{}') || 
            COALESCE(v_emails_franqueados, '{}') || 
            COALESCE(v_emails_auth_users, '{}')
        )
        ORDER BY 1
    );

    RETURN json_build_object(
        'emails', v_all_emails,
        'total_count', array_length(v_all_emails, 1),
        'usuarios_internos_count', array_length(v_emails_usuarios_internos, 1),
        'franqueados_count', array_length(v_emails_franqueados, 1),
        'auth_users_count', array_length(v_emails_auth_users, 1)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'emails', '[]'::json
        );
END;
$$;

-- Comentário
COMMENT ON FUNCTION listar_emails_cadastrados IS 
'Lista todos os emails cadastrados no sistema (usuarios_internos, franqueados, auth.users) usando SECURITY DEFINER para bypassar RLS';

-- Garantir que authenticated users podem executar esta função
GRANT EXECUTE ON FUNCTION listar_emails_cadastrados TO authenticated;
