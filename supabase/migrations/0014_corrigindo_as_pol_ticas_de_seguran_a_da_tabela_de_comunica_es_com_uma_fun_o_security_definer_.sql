-- 1. Habilitar RLS na tabela de comunicações para garantir que as políticas sejam aplicadas
ALTER TABLE public.comunicacoes ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas e conflitantes para um estado limpo
DROP POLICY IF EXISTS permitir_acesso_total_interno_mensagens ON public.comunicacoes;
DROP POLICY IF EXISTS "Permitir leitura de logs para usuários internos" ON public.comunicacoes;

-- 3. Criar uma função segura para verificar se um usuário pertence à equipe interna
-- SECURITY DEFINER é a chave aqui: permite que a função verifique a tabela usuarios_internos sem ser bloqueada por outras políticas RLS.
CREATE OR REPLACE FUNCTION public.is_internal_user(user_id_to_check uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_internos
    WHERE user_id = user_id_to_check
  );
$$;

-- 4. Criar a nova política de LEITURA que utiliza a função segura
CREATE POLICY "Permitir que usuários internos leiam todos os logs"
ON public.comunicacoes
FOR SELECT
TO authenticated
USING (
  public.is_internal_user(auth.uid())
);

-- 5. Criar uma política de INSERÇÃO para o futuro, caso a aplicação precise inserir logs diretamente
CREATE POLICY "Permitir que usuários internos insiram logs"
ON public.comunicacoes
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_internal_user(auth.uid())
);