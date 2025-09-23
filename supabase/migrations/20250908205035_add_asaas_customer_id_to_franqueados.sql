-- Adicionar campo asaas_customer_id à tabela franqueados para armazenar o ID do cliente no ASAAS

ALTER TABLE franqueados 
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- Criar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_franqueados_asaas_customer_id ON franqueados(asaas_customer_id);

-- Comentário explicativo
COMMENT ON COLUMN franqueados.asaas_customer_id IS 'ID do cliente no sistema ASAAS para integração de cobranças';
