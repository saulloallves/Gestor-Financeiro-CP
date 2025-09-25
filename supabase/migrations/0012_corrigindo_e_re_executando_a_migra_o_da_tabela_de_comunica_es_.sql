-- 1. Renomear a tabela 'mensagens' para 'comunicacoes'
ALTER TABLE public.mensagens RENAME TO comunicacoes;

-- 2. Remover as constraints antigas que causaram o erro
-- O nome da constraint não muda quando a tabela é renomeada.
ALTER TABLE public.comunicacoes DROP CONSTRAINT IF EXISTS mensagens_direcao_check;
ALTER TABLE public.comunicacoes DROP CONSTRAINT IF EXISTS mensagens_status_envio_check; -- Tentativa de remover a constraint de status também

-- 3. Renomear as colunas para o novo padrão
ALTER TABLE public.comunicacoes RENAME COLUMN direcao TO tipo_mensagem;
ALTER TABLE public.comunicacoes RENAME COLUMN status_envio TO status;
ALTER TABLE public.comunicacoes RENAME COLUMN created_at TO data_envio;

-- 4. Adicionar as novas colunas necessárias
ALTER TABLE public.comunicacoes
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enviado_por_usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS enviado_por_ia BOOLEAN DEFAULT false;

-- 5. Agora, com as constraints removidas, podemos atualizar os dados
UPDATE public.comunicacoes SET tipo_mensagem = 'automatica' WHERE tipo_mensagem = 'enviada';
UPDATE public.comunicacoes SET enviado_por_ia = true WHERE enviado_por = 'ia_agente_financeiro';

-- 6. Finalmente, adicionar as novas e corretas constraints
ALTER TABLE public.comunicacoes ADD CONSTRAINT chk_tipo_mensagem CHECK (tipo_mensagem IN ('automatica', 'manual', 'recebida'));
ALTER TABLE public.comunicacoes ADD CONSTRAINT chk_status CHECK (status IN ('enviado', 'entregue', 'lido', 'erro', 'recebido'));