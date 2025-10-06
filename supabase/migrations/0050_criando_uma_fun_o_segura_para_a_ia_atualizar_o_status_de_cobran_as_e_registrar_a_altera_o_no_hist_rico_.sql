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
    v_user_id uuid;
    v_user_email text;
    v_cobranca record;
BEGIN
    -- 1. Obter o ID e email do usuário que está executando a ação
    v_user_id := auth.uid();
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- 2. Buscar a cobrança e seu status atual
    SELECT * INTO v_cobranca FROM public.cobrancas WHERE id = p_cobranca_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cobrança com ID % não encontrada.', p_cobranca_id;
    END IF;
    v_old_status := v_cobranca.status;

    -- 3. Atualizar a cobrança com o novo status
    UPDATE public.cobrancas
    SET 
        status = p_novo_status,
        updated_at = now(),
        updated_by = v_user_id
    WHERE id = p_cobranca_id;

    -- 4. Inserir um registro de auditoria na tabela de histórico
    INSERT INTO public.historico_cobrancas (cobranca_id, acao, descricao, status_anterior, status_novo, usuario_id, metadados)
    VALUES (
        p_cobranca_id,
        'status_update_ia',
        'Status alterado de "' || v_old_status || '" para "' || p_novo_status || '" via Agente IA.',
        v_old_status,
        p_novo_status,
        v_user_id,
        jsonb_build_object('user_email', v_user_email, 'agent', 'agente_chat_interno')
    );

    -- 5. Retornar uma confirmação de sucesso
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