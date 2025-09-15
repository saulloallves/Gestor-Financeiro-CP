-- Migration para corrigir o rastreamento de ultimo_login
-- Reativando o sistema que atualiza ultimo_login quando um usuário faz login

-- ==============================================
-- FUNÇÃO PARA ATUALIZAR ULTIMO_LOGIN
-- ==============================================

-- Recriar função de update do ultimo_login
CREATE OR REPLACE FUNCTION update_ultimo_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se last_sign_in_at foi alterado (novo login)
    IF OLD IS NULL OR OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        -- Atualizar ultimo_login na tabela usuarios_internos
        UPDATE usuarios_internos
        SET ultimo_login = NEW.last_sign_in_at
        WHERE user_id = NEW.id;
        
        -- Log para debug (opcional)
        RAISE NOTICE 'Atualizando ultimo_login para user_id: % com timestamp: %', NEW.id, NEW.last_sign_in_at;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ==============================================
-- TRIGGER PARA CAPTURAR UPDATES NO AUTH.USERS
-- ==============================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_update_ultimo_login ON auth.users;

-- Criar novo trigger
CREATE TRIGGER trigger_update_ultimo_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION update_ultimo_login();

-- ==============================================
-- ATUALIZAR FUNÇÃO get_internal_user_data
-- ==============================================

-- Atualizar função para incluir ultimo_login no retorno
CREATE OR REPLACE FUNCTION get_internal_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_data JSON;
BEGIN
    -- Buscar dados do usuário interno incluindo ultimo_login
    SELECT json_build_object(
        'id', ui.id,
        'user_id', ui.user_id,
        'nome', ui.nome,
        'email', ui.email,
        'telefone', ui.telefone,
        'perfil', ui.perfil,
        'status', ui.status,
        'ultimo_login', ui.ultimo_login,
        -- Campos de primeiro acesso
        'primeiro_acesso', COALESCE(ui.primeiro_acesso, false),
        'senha_temporaria', COALESCE(ui.senha_temporaria, false),
        'data_criacao', ui.data_criacao,
        'data_ultima_senha', ui.data_ultima_senha
    ) INTO v_user_data
    FROM usuarios_internos ui
    WHERE ui.user_id = p_user_id;
    
    -- Retornar dados ou null se não encontrado
    RETURN v_user_data;
END;
$$;

-- ==============================================
-- ATUALIZAR ULTIMO_LOGIN MANUALMENTE PARA TESTE
-- ==============================================

-- Atualizar ultimo_login para todos os usuários baseado no last_sign_in_at do auth.users
UPDATE usuarios_internos
SET ultimo_login = au.last_sign_in_at
FROM auth.users au
WHERE usuarios_internos.user_id = au.id
  AND au.last_sign_in_at IS NOT NULL;

-- ==============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION update_ultimo_login() IS 'Trigger function para atualizar ultimo_login automaticamente quando usuário faz login';
