-- Migração para adicionar validação de status inativo no login
-- Data: 15/09/2025
-- Objetivo: Impedir que usuários com status 'inativo' façam login

-- ==============================================
-- ATUALIZAR FUNÇÃO get_internal_user_data
-- ==============================================

-- Modificar função para verificar status ativo antes de retornar dados
CREATE OR REPLACE FUNCTION get_internal_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_data JSON;
    v_status TEXT;
BEGIN
    -- Primeiro verificar se usuário existe e está ativo
    SELECT ui.status INTO v_status
    FROM usuarios_internos ui
    WHERE ui.user_id = p_user_id;
    
    -- Se usuário não encontrado, retornar null
    IF v_status IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Se usuário está inativo, lançar erro específico
    IF v_status = 'inativo' THEN
        RAISE EXCEPTION 'USUARIO_INATIVO: Usuário está inativo e não pode fazer login'
            USING ERRCODE = 'P0001';
    END IF;
    
    -- Se chegou até aqui, usuário existe e está ativo
    -- Buscar dados completos do usuário interno
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
    WHERE ui.user_id = p_user_id
      AND ui.status = 'ativo'; -- Garantia adicional
    
    RETURN v_user_data;
END;
$$;

-- ==============================================
-- COMENTÁRIOS E PERMISSÕES
-- ==============================================

COMMENT ON FUNCTION get_internal_user_data(UUID) IS 
'Busca dados completos do usuário interno com validação de status ativo. 
Lança exceção USUARIO_INATIVO se o usuário estiver inativo.';

-- Garantir que a função continue acessível para usuários autenticados
GRANT EXECUTE ON FUNCTION get_internal_user_data(UUID) TO authenticated;

-- ==============================================
-- TESTE DA VALIDAÇÃO
-- ==============================================

DO $$
DECLARE
    test_user_id UUID;
    test_result JSON;
    test_error TEXT;
BEGIN
    RAISE NOTICE '=== TESTANDO VALIDAÇÃO DE STATUS INATIVO ===';
    
    -- Buscar um usuário existente para testar
    SELECT ui.user_id INTO test_user_id
    FROM usuarios_internos ui
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testando com user_id: %', test_user_id;
        
        -- Teste 1: Usuário ativo (deve funcionar)
        BEGIN
            -- Garantir que está ativo
            UPDATE usuarios_internos 
            SET status = 'ativo' 
            WHERE user_id = test_user_id;
            
            SELECT get_internal_user_data(test_user_id) INTO test_result;
            RAISE NOTICE 'Teste usuário ATIVO: SUCCESS - Dados retornados';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Teste usuário ATIVO: ERRO - %', SQLERRM;
        END;
        
        -- Teste 2: Usuário inativo (deve falhar)
        BEGIN
            -- Tornar inativo temporariamente
            UPDATE usuarios_internos 
            SET status = 'inativo' 
            WHERE user_id = test_user_id;
            
            SELECT get_internal_user_data(test_user_id) INTO test_result;
            RAISE NOTICE 'Teste usuário INATIVO: FALHOU - Não deveria retornar dados';
        EXCEPTION WHEN OTHERS THEN
            IF SQLERRM LIKE '%USUARIO_INATIVO%' THEN
                RAISE NOTICE 'Teste usuário INATIVO: SUCCESS - Exceção correta lançada';
            ELSE
                RAISE NOTICE 'Teste usuário INATIVO: ERRO INESPERADO - %', SQLERRM;
            END IF;
        END;
        
        -- Restaurar estado ativo
        UPDATE usuarios_internos 
        SET status = 'ativo' 
        WHERE user_id = test_user_id;
        
        RAISE NOTICE 'Status do usuário teste restaurado para ATIVO';
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
    
    RAISE NOTICE '=== FIM DO TESTE ===';
END;
$$;