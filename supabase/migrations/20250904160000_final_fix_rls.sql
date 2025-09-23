-- SOLUÇÃO DEFINITIVA: Remover todas as políticas e criar apenas as necessárias
-- Remove COMPLETAMENTE todas as políticas problemáticas de usuarios_internos

-- ==============================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ==============================================

-- Remover TODAS as políticas de usuarios_internos (incluindo as recém-criadas)
DROP POLICY IF EXISTS "usuarios_podem_ver_proprios_dados" ON usuarios_internos;
DROP POLICY IF EXISTS "usuarios_podem_atualizar_proprios_dados" ON usuarios_internos;
DROP POLICY IF EXISTS "administradores_podem_ver_tudo" ON usuarios_internos;
DROP POLICY IF EXISTS "administradores_podem_fazer_tudo" ON usuarios_internos;
DROP POLICY IF EXISTS "gestores_podem_ver_usuarios" ON usuarios_internos;

-- Remover política problemática de unidades também
DROP POLICY IF EXISTS "admin_manager_can_access_units" ON unidades;

-- Remover função problemática
DROP FUNCTION IF EXISTS is_admin_or_manager();

-- ==============================================
-- 2. CRIAR POLÍTICA SIMPLES PARA usuarios_internos
-- ==============================================

-- ÚNICA política para usuarios_internos: apenas dados próprios
CREATE POLICY "users_own_data_only" ON usuarios_internos
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- 3. CRIAR POLÍTICA SIMPLES PARA UNIDADES
-- ==============================================

-- Para unidades: TODOS usuários autenticados podem acessar
-- (controle de acesso será feito no nível da aplicação)
CREATE POLICY "authenticated_users_can_access_units" ON unidades
    FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================
-- 4. GARANTIR QUE RLS ESTÁ HABILITADO
-- ==============================================

ALTER TABLE usuarios_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. COMENTÁRIO EXPLICATIVO
-- ==============================================

-- Esta solução remove TODAS as políticas complexas que causam recursão.
-- Agora temos apenas:
-- 1. usuarios_internos: usuários veem apenas seus próprios dados
-- 2. unidades: todos usuários autenticados podem acessar
-- 
-- O controle de acesso detalhado (admin vs gestor vs franqueado) 
-- será implementado no nível da aplicação, não no banco de dados.
-- 
-- Isso evita COMPLETAMENTE qualquer recursão RLS.
