-- Migration: Criar função para criação de usuários internos com autenticação
-- Data: 2025-09-05

-- Drop function if exists (para recriar)
DROP FUNCTION IF EXISTS create_usuario_interno_with_auth(
    TEXT, TEXT, TEXT, TEXT, TEXT
);

-- Criar função para criar usuário interno com autenticação
CREATE OR REPLACE FUNCTION create_usuario_interno_with_auth(
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT DEFAULT NULL,
    p_perfil TEXT DEFAULT 'operador',
    p_equipe_id UUID DEFAULT NULL,
    p_senha TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do proprietário da função
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_password TEXT;
    v_senha_final TEXT;
    v_resultado JSON;
BEGIN
    -- Validar perfil
    IF p_perfil NOT IN ('operador', 'gestor', 'juridico', 'admin') THEN
        RAISE EXCEPTION 'Perfil inválido. Use: operador, gestor, juridico ou admin';
    END IF;

    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM auth.users au WHERE au.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está em uso', p_email;
    END IF;

    -- Gerar senha se não fornecida
    IF p_senha IS NULL OR p_senha = '' THEN
        v_senha_final := substring(md5(random()::text) from 1 for 8) || 'A1!';
    ELSE
        v_senha_final := p_senha;
    END IF;

    -- Gerar ID único
    v_user_id := gen_random_uuid();
    
    -- Criptografar senha (método simples para desenvolvimento)
    v_encrypted_password := crypt(v_senha_final, gen_salt('bf'));
    
    -- Criar usuário no auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        last_sign_in_at
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        p_email,
        v_encrypted_password,
        NOW(),
        '',
        '',
        '',
        '',
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        FALSE,
        NULL
    );

    -- Criar registro na tabela usuarios_internos
    INSERT INTO usuarios_internos (
        id,
        user_id,
        nome,
        email,
        telefone,
        perfil,
        equipe_id,
        status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        p_nome,
        p_email,
        p_telefone,
        p_perfil::perfil_usuario_enum,
        p_equipe_id,
        'ativo'::status_usuario_enum,
        NOW(),
        NOW()
    );

    -- Preparar resultado
    v_resultado := json_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', p_email,
        'senha_temporaria', v_senha_final,
        'message', 'Usuário criado com sucesso'
    );

    RETURN v_resultado;

EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, retornar informações do erro
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Erro ao criar usuário interno'
        );
END;
$$;

-- Comentário da função
COMMENT ON FUNCTION create_usuario_interno_with_auth IS 
'Cria um usuário interno com conta de autenticação. Retorna JSON com resultado da operação.';
