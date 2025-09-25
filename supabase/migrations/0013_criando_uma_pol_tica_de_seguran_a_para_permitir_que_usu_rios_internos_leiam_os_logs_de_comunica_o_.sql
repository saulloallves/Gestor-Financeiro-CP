CREATE POLICY "Permitir leitura de logs para usuários internos"
ON public.comunicacoes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM usuarios_internos
    WHERE user_id = auth.uid()
  )
);