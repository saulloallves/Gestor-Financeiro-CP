-- Tabela para registrar todas as comunicações (mensagens)
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cobranca_id UUID REFERENCES public.cobrancas(id) ON DELETE SET NULL,
    
    -- Dados da Unidade (snapshot)
    unidade_id UUID,
    unidade_codigo_unidade TEXT,
    unidade_nome_padrao TEXT,
    
    -- Dados do Franqueado (snapshot)
    franqueado_id UUID,
    franqueado_nome TEXT,

    canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email')),
    direcao TEXT NOT NULL DEFAULT 'enviada' CHECK (direcao IN ('enviada', 'recebida')),
    conteudo TEXT NOT NULL,
    status_envio TEXT DEFAULT 'enviado' CHECK (status_envio IN ('enviado', 'falhou', 'entregue', 'lido')),
    external_id TEXT, -- ID da mensagem no Z-API, Brevo, etc.
    enviado_por TEXT DEFAULT 'ia_agente_financeiro',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.mensagens IS 'Log de todas as comunicações enviadas e recebidas pelo sistema.';

-- Tabela para registrar agendamentos de reuniões
CREATE TABLE IF NOT EXISTS public.eventos_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cobranca_id UUID REFERENCES public.cobrancas(id) ON DELETE CASCADE,
    usuario_interno_id UUID REFERENCES public.usuarios_internos(id) ON DELETE SET NULL,
    
    -- Dados do Franqueado (snapshot)
    franqueado_id UUID,
    franqueado_nome TEXT,

    data_hora_inicio TIMESTAMPTZ NOT NULL,
    data_hora_fim TIMESTAMPTZ NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'cancelado', 'concluido')),
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.eventos_agenda IS 'Registro de reuniões agendadas pela IA ou manualmente.';

-- Habilitar RLS
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_agenda ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (permitir acesso total para equipe interna por enquanto)
CREATE POLICY "permitir_acesso_total_interno_mensagens" ON public.mensagens
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM usuarios_internos WHERE user_id = auth.uid()
    )
);

CREATE POLICY "permitir_acesso_total_interno_eventos" ON public.eventos_agenda
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM usuarios_internos WHERE user_id = auth.uid()
    )
);