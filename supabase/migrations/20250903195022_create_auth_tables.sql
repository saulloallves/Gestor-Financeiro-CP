-- Create enum for user profiles
CREATE TYPE perfil_usuario AS ENUM ('admin', 'cobranca', 'gestao');

-- Create table for internal users (staff)
CREATE TABLE usuarios_internos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    perfil perfil_usuario NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for franchisees
CREATE TABLE franqueados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    codigo_franquia TEXT UNIQUE NOT NULL,
    nome_fantasia TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_usuarios_internos_email ON usuarios_internos(email);
CREATE INDEX idx_usuarios_internos_user_id ON usuarios_internos(user_id);
CREATE INDEX idx_franqueados_codigo ON franqueados(codigo_franquia);
CREATE INDEX idx_franqueados_user_id ON franqueados(user_id);

-- Enable Row Level Security
ALTER TABLE usuarios_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE franqueados ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usuarios_internos
-- Internal users can view their own data
CREATE POLICY "Internal users can view own data" ON usuarios_internos
    FOR SELECT USING (auth.uid() = user_id);

-- Internal users can update their own data
CREATE POLICY "Internal users can update own data" ON usuarios_internos
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all internal users
CREATE POLICY "Admins can view all internal users" ON usuarios_internos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );

-- RLS Policies for franqueados
-- Franchisees can view their own data
CREATE POLICY "Franchisees can view own data" ON franqueados
    FOR SELECT USING (auth.uid() = user_id);

-- Franchisees can update their own data
CREATE POLICY "Franchisees can update own data" ON franqueados
    FOR UPDATE USING (auth.uid() = user_id);

-- Internal users can view all franchisees
CREATE POLICY "Internal users can view franchisees" ON franqueados
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid()
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_usuarios_internos_updated_at 
    BEFORE UPDATE ON usuarios_internos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franqueados_updated_at 
    BEFORE UPDATE ON franqueados 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert the initial internal user (Marcus Vinicius)
-- Note: This assumes the user was already created in auth.users with this email
INSERT INTO usuarios_internos (nome, email, perfil, user_id)
SELECT 
    'Marcus Vinicius', 
    'marcus.vinicius@crescieperdi.com.br', 
    'admin',
    id
FROM auth.users 
WHERE email = 'marcus.vinicius@crescieperdi.com.br'
ON CONFLICT (email) DO NOTHING;
