-- Migration simplificada apenas para criar tabela de equipes
-- Aplicar diretamente no banco remoto

-- ==============================================
-- 1. CRIAR TABELA DE EQUIPES
-- ==============================================

CREATE TABLE IF NOT EXISTS equipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_equipe TEXT NOT NULL UNIQUE,
    descricao TEXT,
    status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. ATUALIZAR TABELA USUARIOS_INTERNOS
-- ==============================================

-- Adicionar colunas se não existirem
ALTER TABLE usuarios_internos 
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS equipe_id UUID REFERENCES equipes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Atualizar enum de perfil se necessário
DO $$ 
BEGIN
    -- Verificar se o novo enum já existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario_new') THEN
        -- Criar novo tipo enum
        CREATE TYPE perfil_usuario_new AS ENUM ('operador', 'gestor', 'juridico', 'admin');
        
        -- Adicionar nova coluna com novo enum
        ALTER TABLE usuarios_internos ADD COLUMN perfil_new perfil_usuario_new DEFAULT 'operador';
        
        -- Migrar dados existentes
        UPDATE usuarios_internos SET perfil_new = 
            CASE 
                WHEN perfil::text = 'admin' THEN 'admin'::perfil_usuario_new
                WHEN perfil::text = 'cobranca' THEN 'operador'::perfil_usuario_new
                WHEN perfil::text = 'gestao' THEN 'gestor'::perfil_usuario_new
                ELSE 'operador'::perfil_usuario_new
            END;
        
        -- Primeiro, remover todas as policies que dependem da coluna perfil
        DROP POLICY IF EXISTS "Admins can view all units" ON unidades;
        DROP POLICY IF EXISTS "Admins can view all franchisees" ON franqueados;
        DROP POLICY IF EXISTS "Admins can view all charges" ON cobrancas;
        DROP POLICY IF EXISTS "Gestores can manage franchisees" ON franqueados;
        DROP POLICY IF EXISTS "Operadores can view franchisees" ON franqueados;
        
        -- Agora podemos remover a coluna antiga
        ALTER TABLE usuarios_internos DROP COLUMN perfil;
        ALTER TABLE usuarios_internos RENAME COLUMN perfil_new TO perfil;
        
        -- Limpar enum antigo
        DROP TYPE perfil_usuario CASCADE;
        ALTER TYPE perfil_usuario_new RENAME TO perfil_usuario;
        
        -- Recriar as policies com o novo enum
        -- Policy para unidades
        CREATE POLICY "Admins can view all units" ON unidades
            FOR ALL USING (
                auth.uid() IN (
                    SELECT user_id FROM usuarios_internos 
                    WHERE perfil = 'admin'
                )
            );
        
        -- Policies para franqueados
        CREATE POLICY "Admins can view all franchisees" ON franqueados
            FOR ALL USING (
                auth.uid() IN (
                    SELECT user_id FROM usuarios_internos 
                    WHERE perfil = 'admin'
                )
            );
            
        CREATE POLICY "Gestores can manage franchisees" ON franqueados
            FOR ALL USING (
                auth.uid() IN (
                    SELECT user_id FROM usuarios_internos 
                    WHERE perfil IN ('admin', 'gestor')
                )
            );
            
        CREATE POLICY "Operadores can view franchisees" ON franqueados
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id FROM usuarios_internos 
                    WHERE perfil IN ('admin', 'gestor', 'operador')
                )
            );
        
        -- Policy para cobranças
        CREATE POLICY "Admins can view all charges" ON cobrancas
            FOR ALL USING (
                auth.uid() IN (
                    SELECT user_id FROM usuarios_internos 
                    WHERE perfil = 'admin'
                )
            );
    END IF;
END $$;

-- ==============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_equipes_nome ON equipes(nome_equipe);
CREATE INDEX IF NOT EXISTS idx_equipes_status ON equipes(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_equipe ON usuarios_internos(equipe_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_status ON usuarios_internos(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_perfil ON usuarios_internos(perfil);
CREATE INDEX IF NOT EXISTS idx_usuarios_internos_ultimo_login ON usuarios_internos(ultimo_login);

-- ==============================================
-- 4. HABILITAR RLS NA TABELA EQUIPES
-- ==============================================

ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. CRIAR POLÍTICAS RLS PARA EQUIPES
-- ==============================================

-- Usuários autenticados podem ver todas as equipes
DROP POLICY IF EXISTS "usuarios_podem_ver_equipes" ON equipes;
CREATE POLICY "usuarios_podem_ver_equipes" ON equipes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Apenas administradores podem gerenciar equipes
DROP POLICY IF EXISTS "administradores_podem_gerenciar_equipes" ON equipes;
CREATE POLICY "administradores_podem_gerenciar_equipes" ON equipes
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM usuarios_internos 
            WHERE perfil = 'admin'
        )
    );

-- ==============================================
-- 6. INSERIR EQUIPES PADRÃO
-- ==============================================

INSERT INTO equipes (nome_equipe, descricao, status) VALUES
('Cobrança', 'Equipe responsável pelo processo de cobrança e recuperação de crédito', 'ativa'),
('Jurídico', 'Equipe responsável pelos processos jurídicos e consultoria legal', 'ativa'),
('Financeiro', 'Equipe responsável pela gestão financeira e contábil', 'ativa'),
('Suporte', 'Equipe responsável pelo suporte técnico e atendimento ao cliente', 'ativa'),
('Gestão', 'Equipe de gestão e administração geral', 'ativa'),
('Comercial', 'Equipe responsável por vendas e relacionamento comercial', 'ativa')
ON CONFLICT (nome_equipe) DO NOTHING;

-- ==============================================
-- 7. CRIAR TRIGGER PARA UPDATED_AT
-- ==============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para equipes
DROP TRIGGER IF EXISTS update_equipes_updated_at ON equipes;
CREATE TRIGGER update_equipes_updated_at 
    BEFORE UPDATE ON equipes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para usuarios_internos (se não existir)
DROP TRIGGER IF EXISTS update_usuarios_internos_updated_at ON usuarios_internos;
CREATE TRIGGER update_usuarios_internos_updated_at 
    BEFORE UPDATE ON usuarios_internos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
