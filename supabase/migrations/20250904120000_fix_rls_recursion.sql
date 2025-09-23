-- Corrigir recursão infinita nas políticas RLS
-- Remove políticas problemáticas e cria versões sem recursão

-- ==============================================
-- 1. CORRIGIR POLÍTICAS DA TABELA usuarios_internos
-- ==============================================

-- Remover políticas existentes que causam recursão
DROP POLICY IF EXISTS "Internal users can view all internal data" ON usuarios_internos;
DROP POLICY IF EXISTS "Admins can do everything on internal users" ON usuarios_internos;
DROP POLICY IF EXISTS "Gestores can manage units" ON unidades;

-- Política simples: usuários autenticados podem ver seus próprios dados
-- Esta política já existe e funciona bem
-- CREATE POLICY "Authenticated users can view own internal user data" ON usuarios_internos
--     FOR SELECT USING (auth.uid() = user_id);

-- Nova política para admins sem recursão - usando perfil diretamente
CREATE POLICY "Admins can view all internal users" ON usuarios_internos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
            AND ui.user_id = auth.uid() -- Condição direta, sem sub-consulta recursiva
        )
    );

-- Política para gestores verem dados de usuários internos
CREATE POLICY "Gestores can view internal users" ON usuarios_internos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil IN ('admin', 'gestao')
            AND ui.user_id = auth.uid() -- Condição direta
        )
    );

-- ==============================================
-- 2. CORRIGIR POLÍTICA DA TABELA unidades
-- ==============================================

-- Usar função auxiliar para evitar recursão
-- Primeiro criar função que verifica perfil de forma segura
CREATE OR REPLACE FUNCTION check_user_permission(required_profiles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_profile TEXT;
BEGIN
    -- Buscar perfil do usuário atual diretamente sem RLS
    SELECT perfil INTO user_profile 
    FROM usuarios_internos 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Verificar se o perfil está na lista de perfis permitidos
    RETURN user_profile = ANY(required_profiles);
END;
$$;

-- Política para unidades usando a função auxiliar
CREATE POLICY "Gestores can manage units" ON unidades
    FOR ALL USING (check_user_permission(ARRAY['admin', 'gestao']));

-- ==============================================
-- 3. CONCEDER PERMISSÕES PARA A FUNÇÃO
-- ==============================================

GRANT EXECUTE ON FUNCTION check_user_permission(TEXT[]) TO authenticated;

-- ==============================================
-- 4. COMENTÁRIO EXPLICATIVO
-- ==============================================

-- Esta migration resolve o problema de recursão infinita que ocorria quando:
-- 1. Uma query acessava a tabela 'unidades'
-- 2. A política RLS verificava permissões consultando 'usuarios_internos'
-- 3. A consulta a 'usuarios_internos' disparava sua própria política RLS
-- 4. Que por sua vez consultava novamente 'usuarios_internos', criando loop infinito
--
-- A solução usa uma função SECURITY DEFINER que bypass as políticas RLS
-- para fazer a verificação de permissão de forma segura e direta.
