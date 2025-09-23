-- Corrige as políticas RLS para permitir acesso durante o login
-- Remove as políticas existentes que estão causando problemas
DROP POLICY IF EXISTS "Internal users can view own data" ON usuarios_internos;
DROP POLICY IF EXISTS "Admins can view all internal users" ON usuarios_internos;
DROP POLICY IF EXISTS "Internal users can update own data" ON usuarios_internos;

-- Cria nova política que permite que usuários autenticados vejam seus próprios dados
-- Esta política permite que o usuário autenticado no Supabase Auth veja seu registro na tabela
CREATE POLICY "Authenticated users can view own internal user data" ON usuarios_internos
    FOR SELECT USING (auth.uid() = user_id);

-- Permite que usuários internos vejam todos os dados de outros usuários internos
-- (para funcionalidades administrativas)
CREATE POLICY "Internal users can view all internal data" ON usuarios_internos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
    );

-- Permite que usuários internos atualizem seus próprios dados
CREATE POLICY "Internal users can update own data" ON usuarios_internos
    FOR UPDATE USING (auth.uid() = user_id);

-- Permite que admins façam qualquer operação
CREATE POLICY "Admins can do everything on internal users" ON usuarios_internos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );
