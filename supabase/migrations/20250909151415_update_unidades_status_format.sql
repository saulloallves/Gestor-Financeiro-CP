-- Migration: Atualizar formato dos status das unidades
-- Data: 2025-09-09
-- Descrição: Migrar status das unidades de português minúsculo para maiúsculo

-- 1. Primeiro, atualizar os valores existentes no banco
UPDATE unidades 
SET status = CASE 
    WHEN status = 'ativo' THEN 'OPERAÇÃO'
    WHEN status = 'em_implantacao' THEN 'IMPLANTAÇÃO' 
    WHEN status = 'suspenso' THEN 'SUSPENSO'
    WHEN status = 'cancelado' THEN 'CANCELADO'
    ELSE status
END;

-- 2. Remover a constraint atual
ALTER TABLE unidades DROP CONSTRAINT IF EXISTS unidades_status_check;

-- 3. Adicionar nova constraint com os novos valores
ALTER TABLE unidades ADD CONSTRAINT unidades_status_check 
    CHECK (status IN ('OPERAÇÃO', 'IMPLANTAÇÃO', 'SUSPENSO', 'CANCELADO'));

-- 4. Atualizar o valor padrão
ALTER TABLE unidades ALTER COLUMN status SET DEFAULT 'OPERAÇÃO';
