-- Migration para recriar funções RPC essenciais para autenticação
-- Estas funções são necessárias para o sistema de login funcionar

-- ==============================================
-- FUNÇÃO: get_internal_user_data
-- ==============================================

-- Dropar função existente se houver
DROP FUNCTION IF EXISTS get_internal_user_data(UUID);

-- Recriar função para buscar dados do usuário interno
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
-- FUNÇÃO: get_franchisee_data
-- ==============================================

-- Dropar função existente se houver
DROP FUNCTION IF EXISTS get_franchisee_data(UUID);

-- Recriar função para buscar dados do franqueado
CREATE OR REPLACE FUNCTION get_franchisee_data(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    email TEXT,
    tipo TEXT,
    unidades_vinculadas JSONB -- JSON com dados das unidades
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

-- ==============================================
-- PERMISSÕES
-- ==============================================

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION get_internal_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_franchisee_data(UUID) TO authenticated;

-- ==============================================
-- COMENTÁRIOS
-- ==============================================

COMMENT ON FUNCTION get_internal_user_data(UUID) IS 
'Busca dados completos do usuário interno após login. Inclui validação de status ativo.';

COMMENT ON FUNCTION get_franchisee_data(UUID) IS 
'Busca dados completos do franqueado após login. Inclui unidades vinculadas.';