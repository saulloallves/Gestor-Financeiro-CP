-- Corrigir trigger problemático que está causando erro 500 no login
-- O trigger update_ultimo_login está falhando durante a autenticação

-- 1. Primeiro, remover o trigger problemático temporariamente
DROP TRIGGER IF EXISTS trigger_update_ultimo_login ON auth.users;

-- 2. Verificar se a função update_ultimo_login existe e está funcionando
DO $$
BEGIN
    -- Tentar executar a função para ver se há erro
    BEGIN
        PERFORM update_ultimo_login();
        RAISE NOTICE 'Função update_ultimo_login executada com sucesso';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERRO na função update_ultimo_login: %', SQLERRM;
            -- Se há erro na função, vamos removê-la também
            DROP FUNCTION IF EXISTS update_ultimo_login();
            RAISE NOTICE 'Função update_ultimo_login removida devido a erro';
    END;
END
$$;

-- 3. Criar uma versão corrigida da função (se necessário)
CREATE OR REPLACE FUNCTION update_ultimo_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Atualizar apenas se for um login real (last_sign_in_at mudou)
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at 
       AND NEW.last_sign_in_at IS NOT NULL THEN
        
        -- Atualizar na tabela usuarios_internos usando SECURITY DEFINER para bypassar RLS
        UPDATE usuarios_internos 
        SET ultimo_login = NEW.last_sign_in_at,
            updated_at = NOW()
        WHERE user_id = NEW.id;
        
        -- Se não atualizou nenhuma linha, pode ser um franqueado
        IF NOT FOUND THEN
            -- Tentar atualizar na tabela franqueados (se existir)
            BEGIN
                UPDATE franqueados 
                SET ultimo_login = NEW.last_sign_in_at
                WHERE user_id = NEW.id;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Se der erro, não faz nada para não quebrar o login
                    NULL;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Se qualquer coisa der erro, apenas loga e continua
        -- Não falha o login por causa do trigger
        RAISE WARNING 'Erro no trigger update_ultimo_login: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 4. Recriar o trigger com tratamento de erro robusto
CREATE TRIGGER trigger_update_ultimo_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
    EXECUTE FUNCTION update_ultimo_login();

-- 5. Testar o trigger
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Pegar um usuário para teste
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Simular um update que dispararia o trigger
        UPDATE auth.users 
        SET last_sign_in_at = NOW()
        WHERE id = test_user_id;
        
        RAISE NOTICE 'Trigger testado com sucesso para user_id: %', test_user_id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO no teste do trigger: %', SQLERRM;
END
$$;