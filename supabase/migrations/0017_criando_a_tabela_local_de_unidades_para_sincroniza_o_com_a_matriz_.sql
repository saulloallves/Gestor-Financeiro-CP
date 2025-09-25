-- Criar a tabela de unidades para ser uma réplica local da Matriz
CREATE TABLE public.unidades (
    id UUID PRIMARY KEY, -- Usaremos o mesmo ID da Matriz para garantir consistência
    codigo_unidade TEXT NOT NULL UNIQUE,
    nome_padrao TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    status TEXT NOT NULL,
    telefone_comercial TEXT,
    email_comercial TEXT,
    endereco_rua TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT,
    endereco_uf CHAR(2),
    endereco_cep TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

-- Política de Segurança: Permitir que todos os usuários autenticados leiam os dados das unidades.
-- Ninguém poderá escrever diretamente, apenas a função de sincronização.
CREATE POLICY "allow_read_for_authenticated_users" ON public.unidades
FOR SELECT TO authenticated USING (true);

-- Criar índices para otimizar as buscas
CREATE INDEX idx_unidades_codigo_unidade ON public.unidades(codigo_unidade);
CREATE INDEX idx_unidades_status ON public.unidades(status);
CREATE INDEX idx_unidades_cidade_uf ON public.unidades(endereco_cidade, endereco_uf);