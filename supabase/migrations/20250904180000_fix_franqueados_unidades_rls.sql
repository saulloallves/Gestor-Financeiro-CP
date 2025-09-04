-- Correção das políticas RLS para franqueados_unidades
-- Permite que usuários internos (através de funções) gerenciem vínculos

-- ============================================
-- POLÍTICAS PARA franqueados_unidades
-- ============================================

-- Permitir INSERT na tabela franqueados_unidades
-- Para usuários internos autenticados ou através de funções SECURITY DEFINER
CREATE POLICY "Allow insert franqueados_unidades" ON franqueados_unidades
    FOR INSERT 
    WITH CHECK (
        -- Usuário interno logado pode inserir
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
        OR
        -- Ou através de funções SECURITY DEFINER (para APIs internas)
        current_setting('role') = 'service_role'
    );

-- Permitir UPDATE na tabela franqueados_unidades  
-- Para usuários internos autenticados ou através de funções SECURITY DEFINER
CREATE POLICY "Allow update franqueados_unidades" ON franqueados_unidades
    FOR UPDATE 
    USING (
        -- Usuário interno logado pode atualizar
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
        OR
        -- Ou através de funções SECURITY DEFINER (para APIs internas)
        current_setting('role') = 'service_role'
    )
    WITH CHECK (
        -- Usuário interno logado pode atualizar
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
        OR
        -- Ou através de funções SECURITY DEFINER (para APIs internas)
        current_setting('role') = 'service_role'
    );

-- Permitir DELETE na tabela franqueados_unidades
-- Para usuários internos autenticados ou através de funções SECURITY DEFINER
CREATE POLICY "Allow delete franqueados_unidades" ON franqueados_unidades
    FOR DELETE 
    USING (
        -- Usuário interno logado pode deletar
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
        OR
        -- Ou através de funções SECURITY DEFINER (para APIs internas)
        current_setting('role') = 'service_role'
    );

-- ============================================
-- ADICIONAR TAMBÉM POLÍTICAS PARA FRANQUEADOS
-- ============================================

-- Permitir que usuários internos insiram novos franqueados
CREATE POLICY "Internal users can insert franqueados" ON franqueados
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
    );

-- Permitir que usuários internos atualizem franqueados
CREATE POLICY "Internal users can update franqueados" ON franqueados
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
    );

-- Permitir que usuários internos vejam todos os franqueados
CREATE POLICY "Internal users can view all franqueados" ON franqueados
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
    );
