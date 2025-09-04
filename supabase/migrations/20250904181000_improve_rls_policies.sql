-- Correção aprimorada das políticas RLS para franqueados_unidades
-- Remove políticas anteriores e cria novas mais específicas

-- ============================================
-- REMOVER POLÍTICAS ANTERIORES (se existem)
-- ============================================

DROP POLICY IF EXISTS "Allow insert franqueados_unidades" ON franqueados_unidades;
DROP POLICY IF EXISTS "Allow update franqueados_unidades" ON franqueados_unidades; 
DROP POLICY IF EXISTS "Allow delete franqueados_unidades" ON franqueados_unidades;
DROP POLICY IF EXISTS "Internal users can insert franqueados" ON franqueados;
DROP POLICY IF EXISTS "Internal users can update franqueados" ON franqueados;
DROP POLICY IF EXISTS "Internal users can view all franqueados" ON franqueados;

-- ============================================
-- NOVAS POLÍTICAS PARA franqueados_unidades
-- ============================================

-- Política mais permissiva para INSERT - permite usuários autenticados
CREATE POLICY "Allow authenticated insert franqueados_unidades" ON franqueados_unidades
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política mais permissiva para UPDATE - permite usuários autenticados
CREATE POLICY "Allow authenticated update franqueados_unidades" ON franqueados_unidades
    FOR UPDATE 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política mais permissiva para DELETE - permite usuários autenticados
CREATE POLICY "Allow authenticated delete franqueados_unidades" ON franqueados_unidades
    FOR DELETE 
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- POLÍTICAS MELHORADAS PARA FRANQUEADOS
-- ============================================

-- Permitir que usuários internos vejam todos os franqueados
CREATE POLICY "Internal users can view all franqueados" ON franqueados
    FOR SELECT 
    USING (
        -- Usuários internos podem ver todos
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
        OR
        -- Ou franqueados podem ver apenas seus próprios dados
        user_id = auth.uid()
    );

-- Permitir que usuários internos insiram franqueados
CREATE POLICY "Internal users can insert franqueados" ON franqueados
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
    );

-- Permitir que usuários internos atualizem franqueados e franqueados atualizem seus próprios dados
CREATE POLICY "Users can update franqueados" ON franqueados
    FOR UPDATE 
    USING (
        -- Usuários internos podem atualizar qualquer franqueado
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
        OR
        -- Ou franqueados podem atualizar seus próprios dados
        user_id = auth.uid()
    )
    WITH CHECK (
        -- Usuários internos podem atualizar qualquer franqueado
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
        OR
        -- Ou franqueados podem atualizar seus próprios dados
        user_id = auth.uid()
    );
