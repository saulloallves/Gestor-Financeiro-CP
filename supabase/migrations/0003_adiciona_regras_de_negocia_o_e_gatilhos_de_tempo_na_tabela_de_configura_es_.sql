-- Adiciona novas colunas de regras de negócio na tabela de configurações
ALTER TABLE public.configuracoes
ADD COLUMN IF NOT EXISTS dias_graca INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_parcelas_acordo INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS juros_acordo NUMERIC(5, 2) DEFAULT 1.50,
ADD COLUMN IF NOT EXISTS desconto_quitacao_avista NUMERIC(5, 2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS dias_lembrete_previo INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS dias_escalonamento_juridico INTEGER DEFAULT 30;

-- Adiciona comentários para explicar cada novo campo
COMMENT ON COLUMN public.configuracoes.dias_graca IS 'Dias de carência após o vencimento antes de aplicar multa e juros.';
COMMENT ON COLUMN public.configuracoes.max_parcelas_acordo IS 'Número máximo de parcelas que a IA pode oferecer em um acordo.';
COMMENT ON COLUMN public.configuracoes.juros_acordo IS 'Taxa de juros mensal (%) para acordos parcelados.';
COMMENT ON COLUMN public.configuracoes.desconto_quitacao_avista IS 'Percentual de desconto que a IA pode oferecer para quitação à vista de dívidas vencidas.';
COMMENT ON COLUMN public.configuracoes.dias_lembrete_previo IS 'Com quantos dias de antecedência a IA deve enviar um lembrete de vencimento.';
COMMENT ON COLUMN public.configuracoes.dias_escalonamento_juridico IS 'Após quantos dias de atraso um caso deve ser escalonado para o departamento jurídico.';