-- Atualizar função de criação de usuário para incluir campos de primeiro acesso
-- Sistema de controle de primeiro acesso integrado

-- ==============================================
-- ATUALIZAR FUNÇÃO DE CRIAÇÃO DE USUÁRIO
-- ==============================================

-- Recriar função com suporte aos novos campos
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
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_password TEXT;
    v_senha_final TEXT;
    v_resultado JSON;
    v_usuario_interno_id UUID;
    v_perfil_final TEXT;
BEGIN
    -- Validar perfil
    IF p_perfil NOT IN ('operador', 'gestor', 'juridico', 'admin') THEN
        RAISE EXCEPTION 'Perfil inválido. Use: operador, gestor, juridico ou admin';
    END IF;

    -- Verificar duplicação de email
    IF EXISTS (SELECT 1 FROM auth.users au WHERE au.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está em uso', p_email;
    END IF;

    IF EXISTS (SELECT 1 FROM usuarios_internos ui WHERE ui.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está cadastrado como usuário interno', p_email;
    END IF;

    IF EXISTS (SELECT 1 FROM franqueados f WHERE f.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está cadastrado como franqueado', p_email;
    END IF;

    -- Gerar senha temporária se não fornecida
    IF p_senha IS NULL OR p_senha = '' THEN
        v_senha_final := substring(md5(random()::text) from 1 for 8) || 'A1!';
    ELSE
        v_senha_final := p_senha;
    END IF;

    -- Gerar IDs
    v_user_id := gen_random_uuid();
    v_usuario_interno_id := gen_random_uuid();
    v_encrypted_password := crypt(v_senha_final, gen_salt('bf'));

    BEGIN
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

        -- Criar registro em usuarios_internos com campos de primeiro acesso
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
            updated_at,
            -- Novos campos de controle de primeiro acesso
            primeiro_acesso,
            senha_temporaria,
            data_criacao,
            data_ultima_senha
        ) VALUES (
            v_usuario_interno_id,
            v_user_id,
            p_nome,
            p_email,
            p_telefone,
            p_perfil::perfil_usuario_enum,
            p_equipe_id,
            'ativo',
            NOW(),
            NOW(),
            -- Definir como primeiro acesso e senha temporária
            true,
            true,
            NOW(),
            NULL -- Será definido quando trocar a senha
        );

        -- Retornar resultado com senha temporária
        v_resultado := json_build_object(
            'success', true,
            'user_id', v_user_id,
            'usuario_interno_id', v_usuario_interno_id,
            'email', p_email,
            'senha_temporaria', v_senha_final,
            'primeiro_acesso', true,
            'message', 'Usuário criado com sucesso. Será necessário trocar a senha no primeiro acesso.'
        );

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro ao criar usuário: %', SQLERRM;
    END;

    RETURN v_resultado;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Erro ao criar usuário interno'
        );
END;
$$;

-- ==============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION create_usuario_interno_with_auth IS 
'Cria usuário interno com autenticação e marca como primeiro acesso';
