-- DROP a função se ela já existir para garantir que estamos criando a versão mais recente
DROP FUNCTION IF EXISTS public.atualizar_status_cobranca(uuid, text);

CREATE OR REPLACE FUNCTION public.atualizar_status_cobranca(
    p_cobranca_id uuid,
    p_novo_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_old_status text;
    v_auth_user_id uuid;
    v_internal_user_id uuid; -- ID do perfil interno
    v_user_email text;
    v_cobranca record;
BEGIN
    -- 1. Obter o ID de autenticação e o email do usuário
    v_auth_user_id := auth.uid();
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_auth_user_id;

    -- 2. Buscar o ID do perfil interno correspondente
    SELECT id INTO v_internal_user_id FROM public.usuarios_internos WHERE user_id = v_auth_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de usuário interno não encontrado para o usuário autenticado.';
    END IF;

    -- 3. Buscar a cobrança e seu status atual
    SELECT * INTO v_cobranca FROM public.cobrancas WHERE id = p_cobranca_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cobrança com ID % não encontrada.', p_cobranca_id;
    END IF;
    v_old_status := v_cobranca.status;

    -- 4. **CORREÇÃO:** Atualizar a cobrança usando o ID do perfil interno para 'updated_by'
    UPDATE public.cobrancas
    SET 
        status = p_novo_status,
        updated_at = now(),
        updated_by = v_internal_user_id -- <<< CORREÇÃO APLICADA AQUI
    WHERE id = p_cobranca_id;

    -- 5. Inserir um registro de auditoria usando o ID do perfil interno
    INSERT INTO public.historico_cobrancas (cobranca_id, acao, descricao, status_anterior, status_novo, usuario_id, metadados)
    VALUES (
        p_cobranca_id,
        'status_update_ia',
        'Status alterado de "' || v_old_status || '" para "' || p_novo_status || '" via Agente IA.',
        v_old_status,
        p_novo_status,
        v_internal_user_id,
        jsonb_build_object('user_email', v_user_email, 'agent', 'agente_chat_interno')
    );

    -- 6. Retornar uma confirmação de sucesso
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Status da cobrança ' || p_cobranca_id || ' atualizado para ' || p_novo_status || ' com sucesso.'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;