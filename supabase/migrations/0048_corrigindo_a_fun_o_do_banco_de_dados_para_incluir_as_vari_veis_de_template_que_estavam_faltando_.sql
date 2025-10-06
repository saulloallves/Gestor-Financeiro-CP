-- DROP a função se ela já existir para garantir que estamos criando a versão mais recente
DROP FUNCTION IF EXISTS public.preparar_dados_para_mensagem(uuid, text);

CREATE OR REPLACE FUNCTION public.preparar_dados_para_mensagem(
    p_cobranca_id uuid,
    p_template_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_cobranca record;
    v_franqueado_unidade record;
    v_template record;
    v_mensagem_final text;
    v_telefone_destino text;
BEGIN
    -- 1. Buscar dados da cobrança
    SELECT * INTO v_cobranca FROM public.cobrancas WHERE id = p_cobranca_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cobrança com ID % não encontrada.', p_cobranca_id;
    END IF;

    -- 2. Buscar dados do franqueado e da unidade
    SELECT * INTO v_franqueado_unidade FROM public.get_franchisee_by_unit_code(v_cobranca.codigo_unidade::text);
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Não foi possível encontrar o franqueado principal para a unidade %.', v_cobranca.codigo_unidade;
    END IF;

    -- 3. Buscar o template
    SELECT * INTO v_template FROM public.templates WHERE nome = p_template_name AND ativo = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template "%" não encontrado ou está inativo.', p_template_name;
    END IF;

    -- 4. Validar se há um número de telefone/whatsapp
    v_telefone_destino := COALESCE(v_franqueado_unidade.whatsapp, v_franqueado_unidade.telefone);
    IF v_telefone_destino IS NULL OR v_telefone_destino = '' THEN
        RAISE EXCEPTION 'O franqueado % não possui um número de WhatsApp ou telefone cadastrado.', v_franqueado_unidade.nome;
    END IF;

    -- 5. Preencher o template com os dados
    v_mensagem_final := v_template.conteudo;
    v_mensagem_final := REPLACE(v_mensagem_final, '{{franqueado.nome}}', v_franqueado_unidade.nome);
    v_mensagem_final := REPLACE(v_mensagem_final, '{{unidade.codigo_unidade}}', v_cobranca.codigo_unidade::text);
    v_mensagem_final := REPLACE(v_mensagem_final, '{{unidade.nome_unidade}}', v_franqueado_unidade.nome_unidade);
    v_mensagem_final := REPLACE(v_mensagem_final, '{{cobranca.valor_atualizado}}', TO_CHAR(v_cobranca.valor_atualizado, 'FM999G999D00'));
    v_mensagem_final := REPLACE(v_mensagem_final, '{{cobranca.vencimento}}', TO_CHAR(v_cobranca.vencimento, 'DD/MM/YYYY'));
    v_mensagem_final := REPLACE(v_mensagem_final, '{{cobranca.link_pagamento}}', COALESCE(v_cobranca.link_pagamento, v_cobranca.link_boleto, 'https://crescieperdi.com.br'));
    
    -- CORREÇÃO: Adicionando as duas variáveis que faltavam
    v_mensagem_final := REPLACE(v_mensagem_final, '{{cobranca.tipo_cobranca}}', v_cobranca.tipo_cobranca);
    v_mensagem_final := REPLACE(v_mensagem_final, '{{cobranca.valor_original}}', TO_CHAR(v_cobranca.valor_original, 'FM999G999D00'));

    -- 6. Retornar todos os dados necessários para a Edge Function
    RETURN jsonb_build_object(
        'mensagem_final', v_mensagem_final,
        'telefone_destino', v_telefone_destino,
        'log_data', jsonb_build_object(
            'cobranca_id', v_cobranca.id,
            'unidade_codigo_unidade', v_cobranca.codigo_unidade,
            'unidade_nome_padrao', v_franqueado_unidade.nome_unidade,
            'franqueado_id', v_franqueado_unidade.id,
            'franqueado_nome', v_franqueado_unidade.nome,
            'template_id', v_template.id,
            'tipo_mensagem', 'automatica',
            'enviado_por', 'ia_agente_chat',
            'enviado_por_ia', true
        )
    );
END;
$$;