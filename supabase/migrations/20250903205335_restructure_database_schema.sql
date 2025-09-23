-- Reestruturação completa do banco de dados conforme especificação do chefe
-- Nova arquitetura: Unidades, Franqueados, Cobranças e relacionamentos

-- ==============================================
-- 1. REMOVER ESTRUTURA ANTIGA (se necessário)
-- ==============================================

-- Remover funções antigas
DROP FUNCTION IF EXISTS get_franchisee_by_code(TEXT);
DROP FUNCTION IF EXISTS get_franchisee_user_data(UUID);

-- Remover tabela antiga de franqueados
DROP TABLE IF EXISTS franqueados CASCADE;

-- ==============================================
-- 2. CRIAR NOVAS TABELAS
-- ==============================================

-- Tabela: unidades (representa as franquias/unidades de negócio)
CREATE TABLE unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_unidade TEXT UNIQUE NOT NULL,
    nome_padrao TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    endereco TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    multifranqueado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: franqueados (representa as pessoas físicas)
CREATE TABLE franqueados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    telefone TEXT,
    email TEXT UNIQUE,
    tipo TEXT DEFAULT 'franqueado' CHECK (tipo IN ('principal', 'socio')),
    prolabore DECIMAL(10,2),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento N:N entre franqueados e unidades
CREATE TABLE franqueados_unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    franqueado_id UUID REFERENCES franqueados(id) ON DELETE CASCADE,
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    data_vinculo TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar vínculos duplicados
    UNIQUE(franqueado_id, unidade_id)
);

-- Tabela: cobrancas (core business da aplicação)
CREATE TABLE cobrancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidade_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    vencimento DATE NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índices para unidades
CREATE INDEX idx_unidades_codigo ON unidades(codigo_unidade);
CREATE INDEX idx_unidades_status ON unidades(status);
CREATE INDEX idx_unidades_cnpj ON unidades(cnpj);

-- Índices para franqueados
CREATE INDEX idx_franqueados_email ON franqueados(email);
CREATE INDEX idx_franqueados_cpf ON franqueados(cpf);
CREATE INDEX idx_franqueados_user_id ON franqueados(user_id);

-- Índices para franqueados_unidades
CREATE INDEX idx_franqueados_unidades_franqueado ON franqueados_unidades(franqueado_id);
CREATE INDEX idx_franqueados_unidades_unidade ON franqueados_unidades(unidade_id);
CREATE INDEX idx_franqueados_unidades_ativo ON franqueados_unidades(ativo);

-- Índices para cobrancas
CREATE INDEX idx_cobrancas_unidade ON cobrancas(unidade_id);
CREATE INDEX idx_cobrancas_status ON cobrancas(status);
CREATE INDEX idx_cobrancas_vencimento ON cobrancas(vencimento);

-- ==============================================
-- 4. POLÍTICAS RLS (Row Level Security)
-- ==============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE franqueados ENABLE ROW LEVEL SECURITY;
ALTER TABLE franqueados_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;

-- RLS para franqueados (podem ver seus próprios dados)
CREATE POLICY "Franqueados can view own data" ON franqueados
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Franqueados can update own data" ON franqueados
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS para unidades (franqueados podem ver unidades vinculadas)
CREATE POLICY "Franqueados can view linked units" ON unidades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM franqueados f
            JOIN franqueados_unidades fu ON f.id = fu.franqueado_id
            WHERE f.user_id = auth.uid() 
            AND fu.unidade_id = unidades.id 
            AND fu.ativo = true
        )
    );

-- RLS para franqueados_unidades
CREATE POLICY "Users can view own unit links" ON franqueados_unidades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM franqueados f 
            WHERE f.id = franqueados_unidades.franqueado_id 
            AND f.user_id = auth.uid()
        )
    );

-- RLS para cobrancas (franqueados podem ver cobranças das suas unidades)
CREATE POLICY "Franqueados can view unit charges" ON cobrancas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM franqueados f
            JOIN franqueados_unidades fu ON f.id = fu.franqueado_id
            WHERE f.user_id = auth.uid() 
            AND fu.unidade_id = cobrancas.unidade_id 
            AND fu.ativo = true
        )
    );

-- Admins podem ver tudo
CREATE POLICY "Admins can view all units" ON unidades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );

CREATE POLICY "Admins can view all franchisees" ON franqueados
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );

CREATE POLICY "Admins can view all charges" ON cobrancas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );
