-- Criação dos tipos ENUM para as novas tabelas
CREATE TYPE public.categoria_conhecimento AS ENUM ('cobrancas', 'juridico', 'negociacoes', 'relatorios', 'suporte');
CREATE TYPE public.status_conhecimento AS ENUM ('ativo', 'inativo');
CREATE TYPE public.tipo_consulta_ia AS ENUM ('resposta', 'resumo', 'negociacao');

-- Tabela: base_conhecimento
-- Armazena os registros centrais da base de conhecimento da IA.
CREATE TABLE public.base_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    categoria public.categoria_conhecimento NOT NULL,
    conteudo TEXT,
    palavras_chave TEXT[],
    status public.status_conhecimento NOT NULL DEFAULT 'ativo',
    criado_por UUID REFERENCES auth.users(id),
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultima_atualizacao TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.base_conhecimento IS 'Repositório central de informações para o Agente de IA.';
COMMENT ON COLUMN public.base_conhecimento.conteudo IS 'Conteúdo textual ou JSON estruturado para a IA.';

-- Tabela: versoes_conhecimento
-- Mantém um histórico de todas as alterações feitas nos registros da base_conhecimento.
CREATE TABLE public.versoes_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conhecimento_id UUID NOT NULL REFERENCES public.base_conhecimento(id) ON DELETE CASCADE,
    conteudo_antigo JSONB,
    conteudo_novo JSONB,
    atualizado_por UUID REFERENCES auth.users(id),
    data_alteracao TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.versoes_conhecimento IS 'Versionamento de alterações nos registros de conhecimento para rastreabilidade.';

-- Tabela: logs_consultas_ia
-- Registra todas as consultas que a IA faz à base de conhecimento.
CREATE TABLE public.logs_consultas_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conhecimento_id UUID REFERENCES public.base_conhecimento(id),
    ia_id TEXT,
    tipo_consulta public.tipo_consulta_ia,
    data_consulta TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.logs_consultas_ia IS 'Logs de auditoria para todas as consultas da IA à base de conhecimento.';
COMMENT ON COLUMN public.logs_consultas_ia.ia_id IS 'Identificador do modelo ou agente de IA que fez a consulta (ex: gpt-4, claude-3).';

-- Políticas de Segurança (RLS)

-- Habilitar RLS para as novas tabelas
ALTER TABLE public.base_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versoes_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_consultas_ia ENABLE ROW LEVEL SECURITY;

-- Policies para base_conhecimento
CREATE POLICY "Permitir leitura para todos os usuários autenticados"
ON public.base_conhecimento FOR SELECT
TO authenticated
USING (true);

-- CREATE POLICY "Permitir inserção para gestores e admins"
-- ON public.base_conhecimento FOR INSERT
-- WITH CHECK (
--   (get_user_perfil(auth.uid()) IN ('admin', 'gestao'))
-- );

-- CREATE POLICY "Permitir atualização para gestores e admins"
-- ON public.base_conhecimento FOR UPDATE
-- USING (
--   (get_user_perfil(auth.uid()) IN ('admin', 'gestao'))
-- );

-- -- Policies para versoes_conhecimento
-- CREATE POLICY "Permitir leitura para gestores e admins"
-- ON public.versoes_conhecimento FOR SELECT
-- TO authenticated
-- USING (
--   (get_user_perfil(auth.uid()) IN ('admin', 'gestao'))
-- );

-- -- Policies para logs_consultas_ia
-- CREATE POLICY "Permitir leitura para gestores e admins"
-- ON public.logs_consultas_ia FOR SELECT
-- TO authenticated
-- USING (
--   (get_user_perfil(auth.uid()) IN ('admin', 'gestao'))
-- );

-- CREATE POLICY "Permitir inserção para o serviço da IA"
-- ON public.logs_consultas_ia FOR INSERT
-- WITH CHECK (
--   (auth.role() = 'service_role') -- Apenas o serviço pode logar
-- );

-- Trigger para atualizar 'ultima_atualizacao' na tabela 'base_conhecimento'
CREATE OR REPLACE FUNCTION public.handle_update_ultima_atualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_base_conhecimento_updated
BEFORE UPDATE ON public.base_conhecimento
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_ultima_atualizacao();
