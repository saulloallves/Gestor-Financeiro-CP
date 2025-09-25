-- Função para sincronizar um registro de 'unidade' da Matriz para a tabela local
CREATE OR REPLACE FUNCTION public.upsert_unidade_from_matriz(
    p_id UUID,
    p_codigo_unidade TEXT,
    p_nome_padrao TEXT,
    p_cnpj TEXT,
    p_status TEXT,
    p_telefone_comercial TEXT,
    p_email_comercial TEXT,
    p_endereco_rua TEXT,
    p_endereco_numero TEXT,
    p_endereco_complemento TEXT,
    p_endereco_bairro TEXT,
    p_endereco_cidade TEXT,
    p_endereco_estado TEXT,
    p_endereco_uf CHAR(2),
    p_endereco_cep TEXT,
    p_created_at TIMESTAMPTZ,
    p_updated_at TIMESTAMPTZ,
    p_raw_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_action TEXT;
BEGIN
    -- Busca o registro antigo (se existir) para a auditoria
    SELECT to_jsonb(u) INTO v_old_data FROM unidades u WHERE id = p_id;

    -- Realiza o UPSERT: Insere um novo registro ou atualiza um existente
    INSERT INTO unidades (
        id, codigo_unidade, nome_padrao, cnpj, status, telefone_comercial, email_comercial,
        endereco_rua, endereco_numero, endereco_complemento, endereco_bairro, endereco_cidade,
        endereco_estado, endereco_uf, endereco_cep, created_at, updated_at
    ) VALUES (
        p_id, p_codigo_unidade, p_nome_padrao, p_cnpj, p_status, p_telefone_comercial, p_email_comercial,
        p_endereco_rua, p_endereco_numero, p_endereco_complemento, p_endereco_bairro, p_endereco_cidade,
        p_endereco_estado, p_endereco_uf, p_endereco_cep, p_created_at, p_updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        codigo_unidade = EXCLUDED.codigo_unidade,
        nome_padrao = EXCLUDED.nome_padrao,
        cnpj = EXCLUDED.cnpj,
        status = EXCLUDED.status,
        telefone_comercial = EXCLUDED.telefone_comercial,
        email_comercial = EXCLUDED.email_comercial,
        endereco_rua = EXCLUDED.endereco_rua,
        endereco_numero = EXCLUDED.endereco_numero,
        endereco_complemento = EXCLUDED.endereco_complemento,
        endereco_bairro = EXCLUDED.endereco_bairro,
        endereco_cidade = EXCLUDED.endereco_cidade,
        endereco_estado = EXCLUDED.endereco_estado,
        endereco_uf = EXCLUDED.endereco_uf,
        endereco_cep = EXCLUDED.endereco_cep,
        updated_at = EXCLUDED.updated_at;

    -- Determina a ação para o log de auditoria
    v_action := CASE WHEN v_old_data IS NULL THEN 'created' ELSE 'updated' END;

    -- Busca o registro após a alteração para o log
    SELECT to_jsonb(u) INTO v_new_data FROM unidades u WHERE id = p_id;

    -- Insere o registro de auditoria
    INSERT INTO matriz_audit_log (entity_type, entity_id, action, changes, raw_payload)
    VALUES ('unidade', p_id, v_action, jsonb_build_object('from', v_old_data, 'to', v_new_data), p_raw_payload);
END;
$$;

-- Função para sincronizar um registro de 'franqueado' da Matriz para a tabela local
CREATE OR REPLACE FUNCTION public.upsert_franqueado_from_matriz(
    p_id UUID,
    p_nome TEXT,
    p_cpf TEXT,
    p_email TEXT,
    p_telefone TEXT,
    p_tipo TEXT,
    p_status TEXT,
    p_created_at TIMESTAMPTZ,
    p_updated_at TIMESTAMPTZ,
    p_raw_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_action TEXT;
BEGIN
    -- Busca o registro antigo (se existir) para a auditoria
    SELECT to_jsonb(f) INTO v_old_data FROM franqueados f WHERE id = p_id;

    -- Realiza o UPSERT
    INSERT INTO franqueados (
        id, nome, cpf, email, telefone, tipo, status, created_at, updated_at
    ) VALUES (
        p_id, p_nome, p_cpf, p_email, p_telefone, p_tipo, p_status, p_created_at, p_updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        cpf = EXCLUDED.cpf,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        tipo = EXCLUDED.tipo,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;

    -- Determina a ação para o log de auditoria
    v_action := CASE WHEN v_old_data IS NULL THEN 'created' ELSE 'updated' END;

    -- Busca o registro após a alteração para o log
    SELECT to_jsonb(f) INTO v_new_data FROM franqueados f WHERE id = p_id;

    -- Insere o registro de auditoria
    INSERT INTO matriz_audit_log (entity_type, entity_id, action, changes, raw_payload)
    VALUES ('franqueado', p_id, v_action, jsonb_build_object('from', v_old_data, 'to', v_new_data), p_raw_payload);
END;
$$;