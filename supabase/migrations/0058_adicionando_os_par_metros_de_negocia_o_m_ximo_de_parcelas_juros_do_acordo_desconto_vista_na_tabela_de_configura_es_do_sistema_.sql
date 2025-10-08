-- Adicionar colunas para os parâmetros de negociação na tabela de configurações
ALTER TABLE public.configuracoes
ADD COLUMN IF NOT EXISTS max_parcelas_acordo INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS juros_acordo NUMERIC(5, 2) DEFAULT 1.50,
ADD COLUMN IF NOT EXISTS desconto_quitacao_avista NUMERIC(5, 2) DEFAULT 5.00;