-- Recria a função para aceitar e salvar o número de WhatsApp
CREATE OR REPLACE FUNCTION public.upsert_franqueado_from_matriz(
    p_id uuid,
    p_nome text,
    p_cpf text,
    p_email text,
    p_telefone text,
    p_whatsapp text, -- Novo parâmetro
    p_tipo text,
    p_status text,
    p_created_at timestamptz,
    p_updated_at timestamptz,
    p_raw_payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        id, nome, cpf, email, telefone, whatsapp, tipo, status, created_at, updated_at
    ) VALUES (
        p_id, p_nome, p_cpf, p_email, p_telefone, p_whatsapp, p_tipo, p_status, p_created_at, p_updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        nome = EXCLUDED.nome,
        cpf = EXCLUDED.cpf,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        whatsapp = EXCLUDED.whatsapp, -- Adicionado ao update
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