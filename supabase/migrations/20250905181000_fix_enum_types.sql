-- Migration: Corrigir tipos enum para usuarios_internos
-- Data: 2025-09-05

-- Criar apenas o enum perfil_usuario_enum se não existir
DO $$ 
BEGIN
    -- Criar o enum perfil_usuario_enum se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario_enum') THEN
        CREATE TYPE perfil_usuario_enum AS ENUM ('operador', 'gestor', 'juridico', 'admin');
        RAISE NOTICE 'Criado tipo perfil_usuario_enum';
    END IF;

    -- Criar o enum status_usuario_enum se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_usuario_enum') THEN
        CREATE TYPE status_usuario_enum AS ENUM ('ativo', 'inativo', 'suspenso');
        RAISE NOTICE 'Criado tipo status_usuario_enum';
    END IF;
END $$;

-- Comentários
COMMENT ON TYPE perfil_usuario_enum IS 'Tipos de perfil para usuários internos: operador, gestor, juridico, admin';
COMMENT ON TYPE status_usuario_enum IS 'Status possíveis para usuários: ativo, inativo, suspenso';
