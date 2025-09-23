-- Atualizar função get_internal_user_data para incluir user_id e outros campos necessários
-- Corrigir problema de autenticação de primeiro acesso

-- ==============================================
-- DROPAR FUNÇÃO EXISTENTE E RECRIAR
-- ==============================================

-- Primeiro dropar a função existente
DROP FUNCTION IF EXISTS get_internal_user_data(UUID);

-- Recriar com todos os campos necessários
CREATE OR REPLACE FUNCTION get_internal_user_data(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    nome TEXT,
    email TEXT,
    telefone TEXT,
    perfil perfil_usuario_enum,
    equipe_id UUID,
    status status_usuario_enum,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    primeiro_acesso BOOLEAN,
    senha_temporaria BOOLEAN,
    data_criacao TIMESTAMP WITH TIME ZONE,
    data_ultima_senha TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.user_id,
        ui.nome,
        ui.email,
        ui.telefone,
        ui.perfil,
        ui.equipe_id,
        ui.status,
        ui.ultimo_login,
        ui.primeiro_acesso,
        ui.senha_temporaria,
        ui.data_criacao,
        ui.data_ultima_senha,
        ui.created_at,
        ui.updated_at
    FROM usuarios_internos ui
    WHERE ui.user_id = user_uuid;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_internal_user_data(UUID) TO authenticated;

-- ==============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

COMMENT ON FUNCTION get_internal_user_data(UUID) IS 
'Função para buscar dados completos do usuário interno após login. Inclui campos de primeiro acesso e controle de senha. Roda com SECURITY DEFINER para bypassar RLS.';
