-- Função para criar franqueado com usuário de autenticação automaticamente
-- Esta função cria um usuário no auth.users e um franqueado, vinculando-os

-- ============================================
-- FUNÇÃO PARA CRIAR FRANQUEADO COMPLETO
-- ============================================

CREATE OR REPLACE FUNCTION create_franqueado_with_auth(
    -- Dados obrigatórios
    p_nome TEXT,
    p_cpf TEXT,
    p_telefone TEXT,
    p_email_pessoal TEXT,
    -- Dados opcionais com padrão
    p_nome_completo TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_email_comercial TEXT DEFAULT NULL,
    p_tipo TEXT DEFAULT 'principal',
    p_prolabore DECIMAL DEFAULT NULL,
    p_nacionalidade TEXT DEFAULT 'Brasileira',
    p_data_nascimento DATE DEFAULT NULL,
    p_endereco_rua TEXT DEFAULT NULL,
    p_endereco_numero TEXT DEFAULT NULL,
    p_endereco_complemento TEXT DEFAULT NULL,
    p_endereco_bairro TEXT DEFAULT NULL,
    p_endereco_cidade TEXT DEFAULT NULL,
    p_endereco_estado TEXT DEFAULT NULL,
    p_endereco_cep TEXT DEFAULT NULL,
    p_contrato_social BOOLEAN DEFAULT FALSE,
    p_disponibilidade TEXT DEFAULT 'integral',
    p_profissao_anterior TEXT DEFAULT NULL,
    p_empreendedor_previo BOOLEAN DEFAULT FALSE,
    p_status TEXT DEFAULT 'ativo'
)
RETURNS TABLE(
    franqueado_id UUID,
    user_id UUID,
    email TEXT,
    temporary_password TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_franqueado_id UUID;
    v_email TEXT;
    v_temp_password TEXT;
    v_hashed_password TEXT;
BEGIN
    -- Usar email comercial ou pessoal como email principal
    v_email := COALESCE(p_email_comercial, p_email_pessoal);
    
    -- Verificar se email é válido
    IF v_email IS NULL OR v_email = '' THEN
        RAISE EXCEPTION 'Email é obrigatório para criar franqueado';
    END IF;
    
    -- Verificar se email já existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        RAISE EXCEPTION 'Email já está em uso: %', v_email;
    END IF;
    
    -- Gerar senha temporária (8 caracteres)
    v_temp_password := 'CP' || p_cpf::TEXT || '24';
    v_temp_password := REPLACE(v_temp_password, '.', '');
    v_temp_password := REPLACE(v_temp_password, '-', '');
    v_temp_password := LEFT(v_temp_password, 8);
    
    -- Criar hash da senha (bcrypt não está disponível, usando crypt)
    v_hashed_password := crypt(v_temp_password, gen_salt('bf'));
    
    -- Criar usuário no auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        last_sign_in_at
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        v_email,
        v_hashed_password,
        NOW(),
        '',
        '',
        '',
        '',
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"nome": "' || p_nome || '", "tipo": "franqueado"}',
        FALSE,
        NULL
    ) RETURNING id INTO v_user_id;
    
    -- Criar franqueado
    INSERT INTO franqueados (
        nome,
        nome_completo,
        cpf,
        telefone,
        whatsapp,
        email_pessoal,
        email_comercial,
        email, -- Campo calculado para busca
        tipo,
        prolabore,
        nacionalidade,
        data_nascimento,
        endereco_rua,
        endereco_numero,
        endereco_complemento,
        endereco_bairro,
        endereco_cidade,
        endereco_estado,
        endereco_cep,
        contrato_social,
        disponibilidade,
        profissao_anterior,
        empreendedor_previo,
        status,
        user_id
    ) VALUES (
        p_nome,
        COALESCE(p_nome_completo, p_nome),
        p_cpf,
        p_telefone,
        COALESCE(p_whatsapp, p_telefone),
        p_email_pessoal,
        p_email_comercial,
        v_email,
        p_tipo,
        p_prolabore,
        p_nacionalidade,
        p_data_nascimento,
        p_endereco_rua,
        p_endereco_numero,
        p_endereco_complemento,
        p_endereco_bairro,
        p_endereco_cidade,
        p_endereco_estado,
        p_endereco_cep,
        p_contrato_social,
        p_disponibilidade,
        p_profissao_anterior,
        p_empreendedor_previo,
        p_status,
        v_user_id
    ) RETURNING id INTO v_franqueado_id;
    
    -- Retornar dados criados
    RETURN QUERY SELECT 
        v_franqueado_id,
        v_user_id,
        v_email,
        v_temp_password;
END;
$$;

-- ============================================
-- PERMISSÕES
-- ============================================

-- Permitir que usuários internos executem a função
GRANT EXECUTE ON FUNCTION create_franqueado_with_auth TO authenticated;

-- ============================================
-- TRIGGER PARA ATUALIZAR CAMPO EMAIL
-- ============================================

-- Criar função para atualizar campo email automaticamente
CREATE OR REPLACE FUNCTION update_franqueado_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar campo email baseado em email_comercial ou email_pessoal
    NEW.email := COALESCE(NEW.email_comercial, NEW.email_pessoal);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_update_franqueado_email ON franqueados;
CREATE TRIGGER trigger_update_franqueado_email
    BEFORE INSERT OR UPDATE ON franqueados
    FOR EACH ROW
    EXECUTE FUNCTION update_franqueado_email();
