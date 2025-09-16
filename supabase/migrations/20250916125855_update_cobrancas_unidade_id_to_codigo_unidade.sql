-- Migration: Atualizar tabela cobrancas - trocar unidade_id por codigo_unidade
-- Data: 16/09/2025
-- Descrição: Remove a coluna unidade_id (FK) e adiciona codigo_unidade (int4) para referenciar unidades por código de 4 dígitos

BEGIN;

-- Remove a foreign key constraint se existir
ALTER TABLE IF EXISTS cobrancas 
DROP CONSTRAINT IF EXISTS cobrancas_unidade_id_fkey;

-- Remove a coluna unidade_id
ALTER TABLE cobrancas 
DROP COLUMN IF EXISTS unidade_id;

-- Adiciona a nova coluna codigo_unidade
ALTER TABLE cobrancas 
ADD COLUMN codigo_unidade int4 NOT NULL DEFAULT 0;

-- Cria índice para melhorar performance das consultas por código
CREATE INDEX IF NOT EXISTS idx_cobrancas_codigo_unidade ON cobrancas(codigo_unidade);

-- Adiciona comentário na coluna para documentação
COMMENT ON COLUMN cobrancas.codigo_unidade IS 'Código de 4 dígitos que identifica a unidade (ex: 1116, 2546)';

COMMIT;
