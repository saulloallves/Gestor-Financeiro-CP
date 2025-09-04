-- Reconstruir políticas RLS sem recursão infinita
-- Remove todas as políticas problemáticas e cria novas funcionais

-- ==============================================
-- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
-- ==============================================

-- Remover todas as políticas de usuarios_internos que causam recursão
DROP POLICY IF EXISTS "Authenticated users can view own internal user data" ON usuarios_internos;
DROP POLICY IF EXISTS "Internal users can view all internal data" ON usuarios_internos;
DROP POLICY IF EXISTS "Internal users can update own data" ON usuarios_internos;
DROP POLICY IF EXISTS "Admins can do everything on internal users" ON usuarios_internos;
DROP POLICY IF EXISTS "Admins can view all internal users" ON usuarios_internos;
DROP POLICY IF EXISTS "Gestores can view internal users" ON usuarios_internos;

-- Remover política de unidades
DROP POLICY IF EXISTS "Gestores can manage units" ON unidades;
DROP POLICY IF EXISTS "Allow authenticated users to access units" ON unidades;

-- Remover função problemática
DROP FUNCTION IF EXISTS check_user_permission(TEXT[]);

-- ==============================================
-- 2. GARANTIR QUE RLS ESTÁ HABILITADO
-- ==============================================

-- Manter RLS habilitado nas tabelas
ALTER TABLE usuarios_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 3. CRIAR POLÍTICAS RLS SIMPLES E FUNCIONAIS
-- ==============================================

-- Política para usuarios_internos: usuários podem ver apenas seus próprios dados
CREATE POLICY "users_can_view_own_data" ON usuarios_internos
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuarios_internos: usuários podem atualizar apenas seus próprios dados  
CREATE POLICY "users_can_update_own_data" ON usuarios_internos
    FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- 4. CRIAR FUNÇÃO DE VERIFICAÇÃO SEGURA
-- ==============================================

-- Função que verifica se o usuário é admin/gestor sem usar RLS
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_profile TEXT;
BEGIN
    -- Busca direta sem RLS usando SECURITY DEFINER
    SELECT perfil INTO user_profile 
    FROM usuarios_internos 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Retorna true se for admin ou gestao
    RETURN user_profile IN ('admin', 'gestao');
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- ==============================================
-- 5. POLÍTICAS PARA UNIDADES USANDO A FUNÇÃO
-- ==============================================

-- Política para unidades: apenas admins e gestores podem acessar
CREATE POLICY "admin_manager_can_access_units" ON unidades
    FOR ALL USING (is_admin_or_manager());

-- ==============================================
-- 6. POLÍTICAS ADMINISTRATIVAS PARA usuarios_internos
-- ==============================================

-- Política para admins verem todos os usuários internos
CREATE POLICY "admin_can_view_all_users" ON usuarios_internos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui_check 
            WHERE ui_check.user_id = auth.uid() 
            AND ui_check.perfil = 'admin'
        )
    );

-- ==============================================
-- 7. CONCEDER PERMISSÕES
-- ==============================================

GRANT EXECUTE ON FUNCTION is_admin_or_manager() TO authenticated;
