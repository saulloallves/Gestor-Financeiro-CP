-- Migração para corrigir função get_internal_user_data incluindo user_id
-- Necessário para o sistema de primeiro acesso funcionar

-- ==============================================
-- ATUALIZAR FUNÇÃO get_internal_user_data
-- ==============================================

-- Dropar função existente primeiro
DROP FUNCTION IF EXISTS get_internal_user_data(UUID);

-- Recriar função com tipo de retorno correto
CREATE FUNCTION get_internal_user_data(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_data JSON;
BEGIN
    -- Buscar dados do usuário interno incluindo user_id
    SELECT json_build_object(
        'id', ui.id,
        'user_id', ui.user_id,  -- Incluir user_id necessário para primeiro acesso
        'nome', ui.nome,
        'email', ui.email,
        'telefone', ui.telefone,
        'perfil', ui.perfil,
        'status', ui.status,
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
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION get_internal_user_data(UUID) IS 'Busca dados completos do usuário interno incluindo campos de primeiro acesso';
