-- Adicionar campos de endereço à tabela franqueados
-- Incluindo o campo endereco_uf para compatibilidade com a API ViaCEP

-- Adicionar campos de endereço se não existirem
ALTER TABLE franqueados 
ADD COLUMN IF NOT EXISTS endereco_rua TEXT,
ADD COLUMN IF NOT EXISTS endereco_numero TEXT,
ADD COLUMN IF NOT EXISTS endereco_complemento TEXT,
ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
ADD COLUMN IF NOT EXISTS endereco_cidade TEXT,
ADD COLUMN IF NOT EXISTS endereco_estado TEXT,
ADD COLUMN IF NOT EXISTS endereco_uf TEXT,
ADD COLUMN IF NOT EXISTS endereco_cep TEXT;

-- Adicionar campos adicionais de franqueados se não existirem
ALTER TABLE franqueados
ADD COLUMN IF NOT EXISTS nome_completo TEXT,
ADD COLUMN IF NOT EXISTS nacionalidade TEXT DEFAULT 'Brasileira',
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS email_pessoal TEXT,
ADD COLUMN IF NOT EXISTS email_comercial TEXT,
ADD COLUMN IF NOT EXISTS contrato_social BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disponibilidade TEXT DEFAULT 'integral' CHECK (disponibilidade IN ('integral', 'parcial', 'eventos')),
ADD COLUMN IF NOT EXISTS profissao_anterior TEXT,
ADD COLUMN IF NOT EXISTS empreendedor_previo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo'));

-- Atualizar o tipo para usar os valores corretos
ALTER TABLE franqueados
ALTER COLUMN tipo SET DEFAULT 'principal',
DROP CONSTRAINT IF EXISTS franqueados_tipo_check,
ADD CONSTRAINT franqueados_tipo_check CHECK (tipo IN ('principal', 'familiar', 'investidor', 'parceiro'));

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_franqueados_uf ON franqueados(endereco_uf);
CREATE INDEX IF NOT EXISTS idx_franqueados_cidade ON franqueados(endereco_cidade);
CREATE INDEX IF NOT EXISTS idx_franqueados_status ON franqueados(status);
CREATE INDEX IF NOT EXISTS idx_franqueados_tipo ON franqueados(tipo);

-- Comentários para documentação
COMMENT ON COLUMN franqueados.endereco_uf IS 'Sigla do estado (UF) preenchida automaticamente via ViaCEP';
COMMENT ON COLUMN franqueados.endereco_estado IS 'Nome completo do estado preenchido automaticamente via ViaCEP';
