-- Criar a tabela de franqueados para ser uma réplica local da Matriz
CREATE TABLE public.franqueados (
    id UUID PRIMARY KEY, -- Usaremos o mesmo ID da Matriz
    nome TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    email TEXT,
    telefone TEXT,
    tipo TEXT NOT NULL, -- Mapeado de 'owner_type'
    status TEXT NOT NULL, -- Mapeado de 'is_active_system'
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Para login no portal
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.franqueados ENABLE ROW LEVEL SECURITY;

-- Política de Segurança: Permitir que usuários autenticados leiam os dados.
-- Franqueados poderão ver apenas seus próprios dados (será adicionada outra política para isso).
CREATE POLICY "allow_read_for_authenticated_users" ON public.franqueados
FOR SELECT TO authenticated USING (true);

-- Criar índices para otimizar as buscas
CREATE INDEX idx_franqueados_cpf ON public.franqueados(cpf);
CREATE INDEX idx_franqueados_email ON public.franqueados(email);
CREATE INDEX idx_franqueados_status ON public.franqueados(status);