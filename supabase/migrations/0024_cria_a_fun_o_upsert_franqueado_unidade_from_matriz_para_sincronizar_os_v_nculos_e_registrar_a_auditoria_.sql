-- Função para inserir/atualizar um vínculo e registrar no log de auditoria
CREATE OR REPLACE FUNCTION public.upsert_franqueado_unidade_from_matriz(
    p_franqueado_id uuid,
    p_unidade_id uuid,
    p_ativo boolean,
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
    v_entity_id TEXT;
BEGIN
    -- O ID da entidade para o log será a concatenação dos UUIDs
    v_entity_id := p_franqueado_id::text || '_' || p_unidade_id::text;

    -- Busca o registro antigo (se existir) para a auditoria
    SELECT to_jsonb(fu) INTO v_old_data 
    FROM franqueados_unidades fu 
    WHERE franqueado_id = p_franqueado_id AND unidade_id = p_unidade_id;

    -- Realiza o UPSERT
    INSERT INTO franqueados_unidades (
        franqueado_id, unidade_id, ativo, created_at, updated_at
    ) VALUES (
        p_franqueado_id, p_unidade_id, p_ativo, p_created_at, p_updated_at
    )
    ON CONFLICT (franqueado_id, unidade_id) DO UPDATE SET
        ativo = EXCLUDED.ativo,
        updated_at = EXCLUDED.updated_at;

    -- Determina a ação para o log de auditoria
    v_action := CASE WHEN v_old_data IS NULL THEN 'created' ELSE 'updated' END;

    -- Busca o registro após a alteração para o log
    SELECT to_jsonb(fu) INTO v_new_data 
    FROM franqueados_unidades fu 
    WHERE franqueado_id = p_franqueado_id AND unidade_id = p_unidade_id;

    -- Insere o registro de auditoria
    INSERT INTO matriz_audit_log (entity_type, entity_id, action, changes, raw_payload)
    VALUES ('franqueado_unidade', v_entity_id::uuid, v_action, jsonb_build_object('from', v_old_data, 'to', v_new_data), p_raw_payload);
END;
$$;