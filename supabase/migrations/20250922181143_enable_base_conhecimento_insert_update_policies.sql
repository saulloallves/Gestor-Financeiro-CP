-- Habilitar políticas de INSERT e UPDATE para a tabela base_conhecimento

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados"
ON public.base_conhecimento FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para usuários autenticados"
ON public.base_conhecimento FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão para usuários autenticados"
ON public.base_conhecimento FOR DELETE
TO authenticated
USING (true);
