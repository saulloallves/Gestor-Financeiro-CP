-- Funções para nova arquitetura e dados de teste
-- Suporte ao login de franqueados com a nova estrutura

-- ==============================================
-- 1. FUNÇÕES CUSTOMIZADAS (SECURITY DEFINER)
-- ==============================================

-- Função para buscar franqueado por email (para login)
CREATE OR REPLACE FUNCTION get_franchisee_by_email(email_param TEXT)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    email TEXT,
    tipo TEXT,
    user_id UUID,
    unidades TEXT[] -- array com códigos das unidades vinculadas
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nome,
        f.email,
        f.tipo,
        f.user_id,
        COALESCE(
            array_agg(u.codigo_unidade ORDER BY u.codigo_unidade) 
            FILTER (WHERE fu.ativo = true), 
            '{}'::TEXT[]
        ) as unidades
    FROM franqueados f
    LEFT JOIN franqueados_unidades fu ON f.id = fu.franqueado_id AND fu.ativo = true
    LEFT JOIN unidades u ON fu.unidade_id = u.id
    WHERE f.email = email_param
    GROUP BY f.id, f.nome, f.email, f.tipo, f.user_id;
END;
$$;

-- Função para buscar franqueado por código de unidade (alternativa de login)
CREATE OR REPLACE FUNCTION get_franchisee_by_unit_code(codigo_param TEXT)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    email TEXT,
    tipo TEXT,
    user_id UUID,
    codigo_unidade TEXT,
    nome_unidade TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nome,
        f.email,
        f.tipo,
        f.user_id,
        u.codigo_unidade,
        u.nome_padrao as nome_unidade
    FROM franqueados f
    JOIN franqueados_unidades fu ON f.id = fu.franqueado_id AND fu.ativo = true
    JOIN unidades u ON fu.unidade_id = u.id
    WHERE u.codigo_unidade = codigo_param
    LIMIT 1; -- Caso haja múltiplos franqueados na mesma unidade, pega o primeiro
END;
$$;

-- Função para buscar dados completos do franqueado após login
CREATE OR REPLACE FUNCTION get_franchisee_data(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    email TEXT,
    tipo TEXT,
    unidades_vinculadas JSONB -- JSON com dados das unidades
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.nome,
        f.email,
        f.tipo,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', u.id,
                    'codigo', u.codigo_unidade,
                    'nome', u.nome_padrao,
                    'status', u.status
                ) ORDER BY u.codigo_unidade
            ) FILTER (WHERE fu.ativo = true),
            '[]'::jsonb
        ) as unidades_vinculadas
    FROM franqueados f
    LEFT JOIN franqueados_unidades fu ON f.id = fu.franqueado_id AND fu.ativo = true
    LEFT JOIN unidades u ON fu.unidade_id = u.id
    WHERE f.user_id = user_uuid
    GROUP BY f.id, f.nome, f.email, f.tipo;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_franchisee_by_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_franchisee_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_franchisee_by_unit_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_franchisee_by_unit_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_franchisee_data(UUID) TO authenticated;

-- ==============================================
-- 2. DADOS DE TESTE
-- ==============================================

-- Inserir unidades de teste
INSERT INTO unidades (codigo_unidade, nome_padrao, cnpj, endereco, status, multifranqueado) VALUES
('UN001', 'Unidade São Paulo Centro', '12.345.678/0001-90', 'Rua Augusta, 123 - Centro, São Paulo - SP', 'ativo', false),
('UN002', 'Unidade Rio de Janeiro', '12.345.678/0002-71', 'Av. Copacabana, 456 - Copacabana, Rio de Janeiro - RJ', 'ativo', true),
('UN003', 'Unidade Belo Horizonte', '12.345.678/0003-52', 'Rua da Bahia, 789 - Centro, Belo Horizonte - MG', 'ativo', false);

-- Inserir usuário de auth para franqueado (reutilizando o existente se possível)
-- Se o email já existir, apenas ignora
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) 
SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'joao.silva@crescieperdi.com.br',
    crypt('123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'joao.silva@crescieperdi.com.br'
);

-- Inserir franqueado teste
INSERT INTO franqueados (nome, cpf, telefone, email, tipo, prolabore, user_id) VALUES (
    'João Silva',
    '123.456.789-00',
    '(11) 99999-1234',
    'joao.silva@crescieperdi.com.br',
    'principal',
    5000.00,
    (SELECT id FROM auth.users WHERE email = 'joao.silva@crescieperdi.com.br')
);

-- Vincular franqueado às unidades
INSERT INTO franqueados_unidades (franqueado_id, unidade_id, ativo) VALUES 
(
    (SELECT id FROM franqueados WHERE email = 'joao.silva@crescieperdi.com.br'),
    (SELECT id FROM unidades WHERE codigo_unidade = 'UN001'),
    true
),
(
    (SELECT id FROM franqueados WHERE email = 'joao.silva@crescieperdi.com.br'),
    (SELECT id FROM unidades WHERE codigo_unidade = 'UN002'),
    true
);

-- Inserir algumas cobranças de exemplo
INSERT INTO cobrancas (unidade_id, valor, vencimento, status, observacoes) VALUES
(
    (SELECT id FROM unidades WHERE codigo_unidade = 'UN001'),
    2500.00,
    '2025-09-10',
    'pendente',
    'Taxa de franquia mensal'
),
(
    (SELECT id FROM unidades WHERE codigo_unidade = 'UN001'),
    1200.00,
    '2025-08-15',
    'atrasado',
    'Taxa de marketing'
),
(
    (SELECT id FROM unidades WHERE codigo_unidade = 'UN002'),
    3000.00,
    '2025-09-05',
    'pendente',
    'Taxa de franquia mensal'
);
