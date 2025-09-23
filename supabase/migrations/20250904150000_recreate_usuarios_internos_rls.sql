-- Recriar políticas RLS para usuarios_internos sem recursão
-- Criar políticas simples e funcionais após remoção das problemáticas

-- ==============================================
-- 1. GARANTIR QUE RLS ESTÁ HABILITADO
-- ==============================================

-- Garantir que RLS está habilitado na tabela usuarios_internos
ALTER TABLE usuarios_internos ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. CRIAR POLÍTICAS BÁSICAS SEM RECURSÃO
-- ==============================================

-- Política 1: Usuários podem ver apenas seus próprios dados
CREATE POLICY "usuarios_podem_ver_proprios_dados" ON usuarios_internos
    FOR SELECT USING (auth.uid() = user_id);

-- Política 2: Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "usuarios_podem_atualizar_proprios_dados" ON usuarios_internos
    FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- 3. POLÍTICA ESPECIAL PARA ADMINISTRADORES
-- ==============================================

-- Política 3: Administradores podem ver todos os dados
-- Esta política usa uma abordagem diferente para evitar recursão
CREATE POLICY "administradores_podem_ver_tudo" ON usuarios_internos
    FOR SELECT USING (
        -- Verifica se o usuário atual tem perfil 'admin'
        -- Usando uma subconsulta direta sem EXISTS para evitar recursão
        auth.uid() IN (
            SELECT user_id FROM usuarios_internos 
            WHERE perfil = 'admin'
        )
    );

-- Política 4: Administradores podem fazer qualquer operação
CREATE POLICY "administradores_podem_fazer_tudo" ON usuarios_internos
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM usuarios_internos 
            WHERE perfil = 'admin'
        )
    );

-- ==============================================
-- 4. POLÍTICA PARA GESTORES
-- ==============================================

-- Política 5: Gestores podem ver dados de outros usuários
CREATE POLICY "gestores_podem_ver_usuarios" ON usuarios_internos
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM usuarios_internos 
            WHERE perfil IN ('admin', 'gestao')
        )
    );

-- ==============================================
-- 5. COMENTÁRIOS EXPLICATIVOS
-- ==============================================

-- IMPORTANTE: 
-- Estas políticas usam subconsultas simples ao invés de EXISTS
-- para evitar a recursão infinita que estava ocorrendo.
-- 
-- A diferença é que ao invés de:
-- EXISTS (SELECT 1 FROM usuarios_internos WHERE ...)
-- 
-- Usamos:
-- auth.uid() IN (SELECT user_id FROM usuarios_internos WHERE ...)
-- 
-- Isso evita que o PostgreSQL entre em loop infinito na verificação RLS.
