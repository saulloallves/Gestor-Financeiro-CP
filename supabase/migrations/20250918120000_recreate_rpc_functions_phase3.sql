-- =====================================================
-- FASE 3: Recriação das Funções RPC para Produção
-- =====================================================

-- Dropar funções existentes (se houver)
DROP FUNCTION IF EXISTS get_franchisee_data(UUID);
DROP FUNCTION IF EXISTS get_internal_user_data(UUID);

-- =====================================================
-- Função: get_franchisee_data
-- Retorna dados do franqueado com unidades vinculadas
-- =====================================================
CREATE OR REPLACE FUNCTION get_franchisee_data(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    nome TEXT,
    email TEXT,
    tipo TEXT,
    unidades_vinculadas JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nome,
        f.email,
        f.tipo,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', u.id,
                    'codigo', u.codigo_unidade,
                    'nome', u.nome_padrao,
                    'status', u.status
                ) ORDER BY u.codigo_unidade
            ) FILTER (WHERE fu.ativo = true),
            '[]'::jsonb
        ) as unidades_vinculadas
    FROM franqueados f
    LEFT JOIN franqueados_unidades fu ON f.id = fu.franqueado_id AND fu.ativo = true
    LEFT JOIN unidades u ON fu.unidade_id = u.id
    WHERE f.user_id = user_uuid
    GROUP BY f.id, f.nome, f.email, f.tipo;
END;
$$;

-- =====================================================
-- Função: get_internal_user_data  
-- Retorna dados do usuário interno com validações
-- =====================================================
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

-- =====================================================
-- Configurar permissões para as funções
-- =====================================================

-- Permitir que usuários autenticados executem as funções
GRANT EXECUTE ON FUNCTION get_franchisee_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_internal_user_data(UUID) TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION get_franchisee_data(UUID) IS 'Retorna dados do franqueado com suas unidades vinculadas ativas';
COMMENT ON FUNCTION get_internal_user_data(UUID) IS 'Retorna dados do usuário interno com validações de status e primeiro acesso';