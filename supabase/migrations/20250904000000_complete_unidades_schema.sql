-- Completar schema da tabela unidades conforme especificação do módulo 2.1
-- Adicionar campos que estavam faltando para o cadastro completo de unidades

-- ==============================================
-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA UNIDADES
-- ==============================================

-- Adicionar colunas de contato
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS telefone_comercial TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS email_comercial TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Adicionar colunas de endereço detalhado
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_rua TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_numero TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_complemento TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_bairro TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_cidade TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_estado TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_uf TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS endereco_cep TEXT;

-- Adicionar colunas de horário de funcionamento
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS horario_seg_sex TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS horario_sabado TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS horario_domingo TEXT;

-- Adicionar campo para nome do grupo (franqueado principal)
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS nome_grupo TEXT;

-- Atualizar enum de status para incluir mais opções conforme especificação
ALTER TABLE unidades DROP CONSTRAINT IF EXISTS unidades_status_check;
ALTER TABLE unidades ADD CONSTRAINT unidades_status_check 
    CHECK (status IN ('ativo', 'em_implantacao', 'suspenso', 'cancelado'));

-- Adicionar campo para identificar franqueado principal (FK opcional)
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS franqueado_principal_id UUID REFERENCES franqueados(id);

-- ==============================================
-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- ==============================================

-- Índices para busca e filtros
CREATE INDEX IF NOT EXISTS idx_unidades_email_comercial ON unidades(email_comercial);
CREATE INDEX IF NOT EXISTS idx_unidades_telefone ON unidades(telefone_comercial);
CREATE INDEX IF NOT EXISTS idx_unidades_cidade ON unidades(endereco_cidade);
CREATE INDEX IF NOT EXISTS idx_unidades_uf ON unidades(endereco_uf);
CREATE INDEX IF NOT EXISTS idx_unidades_franqueado_principal ON unidades(franqueado_principal_id);

-- ==============================================
-- 3. FUNÇÃO PARA GERAR CÓDIGO SEQUENCIAL DE UNIDADE
-- ==============================================

-- Função para gerar próximo código de unidade (0001, 0002, etc.)
CREATE OR REPLACE FUNCTION generate_next_unit_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
    next_code TEXT;
BEGIN
    -- Buscar o maior número atual
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(codigo_unidade FROM '^UN(\d+)$') AS INTEGER)), 
        0
    ) + 1 INTO next_number
    FROM unidades 
    WHERE codigo_unidade ~ '^UN\d+$';
    
    -- Formatar como UN001, UN002, etc.
    next_code := 'UN' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN next_code;
END;
$$;

-- ==============================================
-- 4. POLÍTICAS RLS PARA MÓDULO DE UNIDADES
-- ==============================================

-- Remover política existente se houver
DROP POLICY IF EXISTS "Gestores can manage units" ON unidades;

-- Gestores e admins podem fazer tudo com unidades
CREATE POLICY "Gestores can manage units" ON unidades
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil IN ('admin', 'gestao')
        )
    );

-- ==============================================
-- 5. TRIGGER PARA AUTO-ATUALIZAÇÃO DE TIMESTAMPS
-- ==============================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela unidades se não existir
DROP TRIGGER IF EXISTS update_unidades_updated_at ON unidades;
CREATE TRIGGER update_unidades_updated_at
    BEFORE UPDATE ON unidades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. CONCEDER PERMISSÕES
-- ==============================================

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION generate_next_unit_code() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
