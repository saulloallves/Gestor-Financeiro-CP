-- 1. Cria um tipo ENUM para os status do Kanban, garantindo consistência dos dados.
CREATE TYPE public.kanban_status_enum AS ENUM (
    'nova',
    'em_contato_ia',
    'em_negociacao_ia',
    'aguardando_pagamento',
    'agendamento_humano',
    'juridico',
    'finalizada',
    'perdida'
);

-- 2. Adiciona a nova coluna 'kanban_status' na tabela de cobranças.
-- O valor padrão 'nova' garante que todas as novas cobranças comecem na primeira coluna do Kanban.
ALTER TABLE public.cobrancas
ADD COLUMN kanban_status public.kanban_status_enum DEFAULT 'nova';

-- 3. Adiciona um comentário na coluna para documentação futura.
COMMENT ON COLUMN public.cobrancas.kanban_status IS 'Status da cobrança no painel Kanban para rastreamento do ciclo de vida.';

-- 4. Cria um índice na nova coluna para otimizar as consultas do Kanban.
CREATE INDEX idx_cobrancas_kanban_status ON public.cobrancas(kanban_status);