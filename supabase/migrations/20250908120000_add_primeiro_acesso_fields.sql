-- Adicionar campos de controle de primeiro acesso à tabela usuarios_internos
-- Sistema de segurança para controle de acesso inicial

-- ==============================================
-- 1. ADICIONAR CAMPOS DE CONTROLE DE PRIMEIRO ACESSO
-- ==============================================

-- Adicionar campos de controle se não existirem
ALTER TABLE usuarios_internos 
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS data_ultima_senha TIMESTAMP WITH TIME ZONE;

-- ==============================================
-- 2. ATUALIZAR DADOS EXISTENTES
-- ==============================================

-- Para usuários já existentes, marcar como não sendo primeiro acesso
-- (assumindo que já fizeram login pelo menos uma vez)
UPDATE usuarios_internos 
SET 
    primeiro_acesso = false,
    senha_temporaria = false,
    data_criacao = created_at,
    data_ultima_senha = created_at
WHERE primeiro_acesso IS NULL OR primeiro_acesso = true;

-- ==============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_usuarios_internos_primeiro_acesso ON usuarios_internos(primeiro_acesso);
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_senha_temporaria ON usuarios_internos(senha_temporaria);
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_data_criacao ON usuarios_internos(data_criacao);

-- ==============================================
-- 4. CRIAR FUNÇÃO PARA CONTROLE DE PRIMEIRO ACESSO
-- ==============================================

-- Função para marcar que o usuário fez o primeiro acesso
CREATE OR REPLACE FUNCTION marcar_primeiro_acesso_completo(
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar campos de controle de primeiro acesso
    UPDATE usuarios_internos 
    SET 
        primeiro_acesso = false,
        senha_temporaria = false,
        data_ultima_senha = NOW(),
        ultimo_login = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Retornar sucesso se encontrou e atualizou o registro
    RETURN FOUND;
END;
$$;

-- ==============================================
-- 5. CRIAR FUNÇÃO PARA TROCAR SENHA DE PRIMEIRO ACESSO
-- ==============================================

-- Função para trocar senha durante primeiro acesso
CREATE OR REPLACE FUNCTION trocar_senha_primeiro_acesso(
    p_user_id UUID,
    p_nova_senha TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_usuario_interno usuarios_internos%ROWTYPE;
    v_result JSON;
BEGIN
    -- Verificar se o usuário existe e precisa trocar senha
    SELECT * INTO v_usuario_interno
    FROM usuarios_internos 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado'
        );
    END IF;
    
    -- Verificar se realmente precisa trocar a senha
    IF NOT v_usuario_interno.primeiro_acesso AND NOT v_usuario_interno.senha_temporaria THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não precisa trocar senha'
        );
    END IF;
    
    -- Atualizar senha no auth.users (usando função administrativa)
    -- NOTA: Esta função precisa ser chamada com privilégios adequados
    UPDATE auth.users 
    SET 
        encrypted_password = crypt(p_nova_senha, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Marcar primeiro acesso como completo
    PERFORM marcar_primeiro_acesso_completo(p_user_id);
    
    RETURN json_build_object(
        'success', true,
        'message', 'Senha alterada com sucesso'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao alterar senha: ' || SQLERRM
        );
END;
$$;

-- ==============================================
-- 6. CRIAR TRIGGER PARA ATUALIZAR ÚLTIMO LOGIN
-- ==============================================

-- Função para atualizar último login automaticamente
CREATE OR REPLACE FUNCTION update_ultimo_login()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar ultimo_login quando last_sign_in_at for alterado
    IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        UPDATE usuarios_internos 
        SET ultimo_login = NEW.last_sign_in_at
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger para atualizar último login automaticamente
DROP TRIGGER IF EXISTS trigger_update_ultimo_login ON auth.users;
CREATE TRIGGER trigger_update_ultimo_login
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_ultimo_login();

-- ==============================================
-- 7. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

COMMENT ON COLUMN usuarios_internos.primeiro_acesso IS 'Indica se o usuário ainda não fez o primeiro acesso completo';
COMMENT ON COLUMN usuarios_internos.senha_temporaria IS 'Indica se o usuário está usando uma senha temporária que precisa ser alterada';
COMMENT ON COLUMN usuarios_internos.data_criacao IS 'Data de criação do usuário no sistema';
COMMENT ON COLUMN usuarios_internos.data_ultima_senha IS 'Data da última alteração de senha do usuário';

COMMENT ON FUNCTION marcar_primeiro_acesso_completo(UUID) IS 'Marca que o usuário completou o primeiro acesso e trocou a senha';
COMMENT ON FUNCTION trocar_senha_primeiro_acesso(UUID, TEXT) IS 'Função para trocar senha durante o primeiro acesso obrigatório';
COMMENT ON FUNCTION update_ultimo_login() IS 'Trigger function para atualizar último login automaticamente';
