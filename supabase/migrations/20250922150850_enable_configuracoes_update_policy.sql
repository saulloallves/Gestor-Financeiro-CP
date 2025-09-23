-- Habilitar política de UPDATE para tabela configuracoes
-- Permite que usuários autenticados atualizem as configurações

DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON public.configuracoes;

CREATE POLICY "Permitir atualização para usuários autenticados"
ON public.configuracoes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
