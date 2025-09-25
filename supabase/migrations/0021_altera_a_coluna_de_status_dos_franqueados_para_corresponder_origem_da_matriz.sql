-- 1. Remover a coluna de status antiga que usava texto ('ativo'/'inativo')
ALTER TABLE public.franqueados DROP COLUMN IF EXISTS status;

-- 2. Adicionar a nova coluna 'is_active_system' que corresponde à matriz
ALTER TABLE public.franqueados ADD COLUMN IF NOT EXISTS is_active_system BOOLEAN NOT NULL DEFAULT true;