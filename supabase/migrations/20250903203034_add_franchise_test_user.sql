-- Adiciona usuário franqueado de teste

-- 1. Criar usuário de auth para franqueado
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
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'franquia01@crescieperdi.com.br',
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
);

-- 2. Inserir dados do franqueado na tabela franqueados
-- Usa o user_id do usuário que acabou de ser criado
INSERT INTO franqueados (user_id, codigo_franquia, nome_fantasia, nome)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'franquia01@crescieperdi.com.br'),
    'FR001',
    'Franquia Exemplo 01',
    'João Silva'
);
