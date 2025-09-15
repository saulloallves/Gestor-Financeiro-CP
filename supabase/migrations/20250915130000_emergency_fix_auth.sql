-- Emergência: Corrigir sistema de autenticação
-- A função que insere diretamente em auth.users pode estar causando problemas

-- Primeiro, vamos limpar possíveis usuários problemáticos
-- ATENÇÃO: Esta função remove apenas o usuário que foi criado recentemente

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Buscar o usuário problemático criado hoje
    SELECT u.id INTO v_user_id
    FROM auth.users u
    WHERE u.email = 'levelcellgames@gmail.com'
    AND u.created_at::date = CURRENT_DATE;
    
    IF v_user_id IS NOT NULL THEN
        -- Remover da tabela usuarios_internos primeiro
        DELETE FROM usuarios_internos WHERE user_id = v_user_id;
        
        -- Remover da tabela auth.users
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário problemático removido: %', v_user_id;
    END IF;
END
$$;

-- Criar versão simplificada da função que não insere em auth.users diretamente
-- Esta função só criará o registro em usuarios_internos, assumindo que o usuário 
-- já foi criado via API normal do Supabase

CREATE OR REPLACE FUNCTION create_usuario_interno_simple(
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT DEFAULT NULL,
    p_perfil TEXT DEFAULT 'operador',
    p_equipe_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL -- Recebe o user_id do auth.users já criado
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_interno_id UUID;
    v_resultado JSON;
BEGIN
    -- Validar perfil
    IF p_perfil NOT IN ('operador', 'gestor', 'juridico', 'admin') THEN
        RAISE EXCEPTION 'Perfil inválido. Use: operador, gestor, juridico ou admin';
    END IF;

    -- Verificar se o user_id existe em auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'User ID % não encontrado em auth.users', p_user_id;
    END IF;

    -- Verificar duplicação de email na tabela usuarios_internos
    IF EXISTS (SELECT 1 FROM usuarios_internos ui WHERE ui.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está cadastrado como usuário interno', p_email;
    END IF;

    -- Gerar ID para usuario_interno
    v_usuario_interno_id := gen_random_uuid();

    BEGIN
        -- Criar registro apenas em usuarios_internos
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
            primeiro_acesso,
            senha_temporaria,
            data_criacao,
            data_ultima_senha
        ) VALUES (
            v_usuario_interno_id,
            p_user_id,
            p_nome,
            p_email,
            p_telefone,
            p_perfil::perfil_usuario_enum,
            p_equipe_id,
            'ativo',
            NOW(),
            NOW(),
            true,
            true,
            NOW(),
            NULL
        );

        -- Retornar resultado
        v_resultado := json_build_object(
            'success', true,
            'user_id', p_user_id,
            'usuario_interno_id', v_usuario_interno_id,
            'email', p_email,
            'message', 'Usuário interno criado com sucesso.'
        );

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro ao criar usuário interno: %', SQLERRM;
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

COMMENT ON FUNCTION create_usuario_interno_simple IS 
'Versão simplificada que apenas cria registro em usuarios_internos para usuário já existente em auth.users';