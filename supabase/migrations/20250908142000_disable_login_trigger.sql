-- Migração de emergência: Desabilitar trigger que pode estar causando problemas no login
-- O trigger update_ultimo_login pode estar interferindo no processo de autenticação

-- ==============================================
-- DESABILITAR TRIGGER TEMPORARIAMENTE
-- ==============================================

-- Remover o trigger que atualiza ultimo_login automaticamente
DROP TRIGGER IF EXISTS trigger_update_ultimo_login ON auth.users;

-- Comentar a função (manter para possível reativação futura)
COMMENT ON FUNCTION update_ultimo_login() IS 'DESABILITADA TEMPORARIAMENTE - Trigger function para atualizar último login automaticamente - Pode estar causando problemas no login';

-- ==============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

-- Este trigger estava tentando atualizar usuarios_internos a cada login
-- Isso pode estar causando deadlocks ou problemas de permissão
-- Precisamos investigar e recriar de forma mais segura
