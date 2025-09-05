-- Verificar se a função create_usuario_interno_with_auth existe
SELECT 
    p.proname as function_name,
    p.prorettype::regtype as return_type,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_usuario_interno_with_auth';

-- Se não existir, vamos ver todas as funções disponíveis
SELECT 
    p.proname as function_name,
    p.prorettype::regtype as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname LIKE '%usuario%'
ORDER BY p.proname;
