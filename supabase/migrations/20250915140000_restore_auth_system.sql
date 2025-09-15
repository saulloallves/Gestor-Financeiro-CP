-- Emergência: Restaurar sistema de autenticação
-- Limpar possíveis inconsistências na tabela auth.users

-- Verificar se há usuários com problemas estruturais
DO $$
DECLARE
    user_record RECORD;
    problema_count INTEGER := 0;
BEGIN
    -- Verificar usuários com campos problemáticos
    FOR user_record IN 
        SELECT id, email, encrypted_password, created_at
        FROM auth.users 
        WHERE created_at::date = CURRENT_DATE  -- Usuários criados hoje
    LOOP
        -- Verificar se o encrypted_password está em formato válido
        IF user_record.encrypted_password IS NULL 
           OR LENGTH(user_record.encrypted_password) < 20
           OR NOT user_record.encrypted_password LIKE '$%' THEN
            
            RAISE NOTICE 'Usuário com problema: % - %', user_record.id, user_record.email;
            problema_count := problema_count + 1;
            
            -- Remover usuário problemático
            DELETE FROM usuarios_internos WHERE user_id = user_record.id;
            DELETE FROM auth.users WHERE id = user_record.id;
            
            RAISE NOTICE 'Usuário removido: %', user_record.email;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total de usuários problemáticos removidos: %', problema_count;
END
$$;

-- Verificar se há outros problemas na estrutura
DO $$
DECLARE
    inconsistencia_count INTEGER := 0;
BEGIN
    -- Verificar usuários em usuarios_internos sem correspondência em auth.users
    SELECT COUNT(*) INTO inconsistencia_count
    FROM usuarios_internos ui
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users au WHERE au.id = ui.user_id
    );
    
    IF inconsistencia_count > 0 THEN
        RAISE NOTICE 'Encontradas % inconsistências em usuarios_internos', inconsistencia_count;
        
        -- Remover registros órfãos
        DELETE FROM usuarios_internos ui
        WHERE NOT EXISTS (
            SELECT 1 FROM auth.users au WHERE au.id = ui.user_id
        );
        
        RAISE NOTICE 'Registros órfãos removidos de usuarios_internos';
    END IF;
END
$$;

-- Garantir que a função de backup funcione
CREATE OR REPLACE FUNCTION test_auth_system()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Teste simples para verificar se o sistema está funcionando
    RETURN json_build_object(
        'status', 'ok',
        'timestamp', NOW(),
        'auth_users_count', (SELECT COUNT(*) FROM auth.users),
        'usuarios_internos_count', (SELECT COUNT(*) FROM usuarios_internos)
    );
END;
$$;