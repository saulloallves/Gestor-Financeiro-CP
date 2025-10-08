-- Enum para o status da negociação
CREATE TYPE negociacao_status AS ENUM ('em_andamento', 'aceita', 'recusada', 'escalada', 'cancelada');

-- Tabela para registrar o estado geral de cada negociação
CREATE TABLE public.negociacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
    franqueado_id UUID REFERENCES public.franqueados(id) ON DELETE SET NULL,
    status negociacao_status NOT NULL DEFAULT 'em_andamento',
    proposta_json JSONB,
    aceite BOOLEAN DEFAULT false,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_encerramento TIMESTAMPTZ,
    ultima_interacao TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela para registrar cada mensagem trocada
CREATE TABLE public.interacoes_negociacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
    mensagem_enviada TEXT,
    mensagem_recebida TEXT,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes_negociacao ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança: Apenas usuários internos podem gerenciar negociações
CREATE POLICY "Permitir acesso total para usuários internos em negociações"
ON public.negociacoes FOR ALL
TO authenticated
USING (is_internal_user(auth.uid()))
WITH CHECK (is_internal_user(auth.uid()));

CREATE POLICY "Permitir acesso total para usuários internos em interações"
ON public.interacoes_negociacao FOR ALL
TO authenticated
USING (is_internal_user(auth.uid()))
WITH CHECK (is_internal_user(auth.uid()));