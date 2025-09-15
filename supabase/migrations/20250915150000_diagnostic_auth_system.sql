-- Diagnóstico completo do sistema de autenticação
-- Verificar e corrigir problemas que podem estar causando "unexpected_failure"

-- 1. Verificar se há triggers problemáticos
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO TRIGGERS NA TABELA auth.users ===';
    
    FOR trigger_record IN 
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
    LOOP
        RAISE NOTICE 'Trigger encontrado: % - % - %', 
            trigger_record.trigger_name, 
            trigger_record.event_manipulation,
            trigger_record.action_statement;
    END LOOP;
END
$$;

-- 2. Verificar estrutura da tabela usuarios_internos
DO $$
DECLARE
    column_record RECORD;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO ESTRUTURA DA TABELA usuarios_internos ===';
    
    -- Verificar colunas
    FOR column_record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'usuarios_internos' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Coluna: % - % - Nullable: % - Default: %', 
            column_record.column_name,
            column_record.data_type,
            column_record.is_nullable,
            column_record.column_default;
    END LOOP;
    
    -- Verificar constraints
    RAISE NOTICE '=== VERIFICANDO CONSTRAINTS ===';
    FOR constraint_record IN 
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = 'usuarios_internos' 
        AND table_schema = 'public'
    LOOP
        RAISE NOTICE 'Constraint: % - %', 
            constraint_record.constraint_name,
            constraint_record.constraint_type;
    END LOOP;
END
$$;

-- 3. Verificar usuários órfãos ou com problemas
DO $$
DECLARE
    problema_count INTEGER := 0;
    user_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO USUÁRIOS PROBLEMÁTICOS ===';
    
    -- Verificar usuários sem encrypted_password válido
    SELECT COUNT(*) INTO problema_count
    FROM auth.users 
    WHERE encrypted_password IS NULL 
       OR LENGTH(encrypted_password) < 20
       OR NOT encrypted_password LIKE '$%';
       
    RAISE NOTICE 'Usuários com senha inválida: %', problema_count;
    
    -- Verificar usuários órfãos em usuarios_internos
    SELECT COUNT(*) INTO problema_count
    FROM usuarios_internos ui
    WHERE NOT EXISTS (
        SELECT 1 FROM auth.users au WHERE au.id = ui.user_id
    );
    
    RAISE NOTICE 'Usuários órfãos em usuarios_internos: %', problema_count;
    
    -- Listar usuários em auth.users
    RAISE NOTICE '=== USUÁRIOS EM auth.users ===';
    FOR user_record IN 
        SELECT id, email, created_at, email_confirmed_at, 
               CASE WHEN encrypted_password IS NOT NULL THEN 'OK' ELSE 'NULL' END as password_status
        FROM auth.users 
        ORDER BY created_at DESC
        LIMIT 10
    LOOP
        RAISE NOTICE 'User: % - % - Created: % - Password: %', 
            user_record.id,
            user_record.email,
            user_record.created_at,
            user_record.password_status;
    END LOOP;
END
$$;

-- 4. Testar função get_internal_user_data
DO $$
DECLARE
    test_user_id UUID;
    test_result JSON;
BEGIN
    RAISE NOTICE '=== TESTANDO FUNÇÃO get_internal_user_data ===';
    
    -- Pegar um usuário para teste
    SELECT au.id INTO test_user_id
    FROM auth.users au
    JOIN usuarios_internos ui ON au.id = ui.user_id
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        SELECT get_internal_user_data(test_user_id) INTO test_result;
        RAISE NOTICE 'Teste da função OK para user_id: %', test_user_id;
        RAISE NOTICE 'Resultado: %', test_result;
    ELSE
        RAISE NOTICE 'Nenhum usuário encontrado para teste';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO na função get_internal_user_data: %', SQLERRM;
END
$$;

-- 5. Verificar políticas RLS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '=== VERIFICANDO POLÍTICAS RLS ===';
    
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'usuarios_internos'
    LOOP
        RAISE NOTICE 'Política: % - % - Roles: %', 
            policy_record.policyname,
            policy_record.cmd,
            policy_record.roles;
    END LOOP;
END
$$;