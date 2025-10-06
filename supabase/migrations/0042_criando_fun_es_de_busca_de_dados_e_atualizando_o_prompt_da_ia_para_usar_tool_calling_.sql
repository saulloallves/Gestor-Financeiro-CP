-- Ferramenta 1: Obter detalhes de uma unidade pelo código
CREATE OR REPLACE FUNCTION get_unit_details_by_code(codigo_param TEXT)
RETURNS TABLE(
    id UUID,
    codigo_unidade TEXT,
    nome_padrao TEXT,
    cnpj TEXT,
    status TEXT,
    telefone_comercial TEXT,
    email_comercial TEXT,
    endereco_completo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.codigo_unidade,
        u.nome_padrao,
        u.cnpj,
        u.status,
        u.telefone_comercial,
        u.email_comercial,
        CONCAT_WS(', ', u.endereco_rua, u.endereco_numero, u.endereco_bairro, u.endereco_cidade, u.endereco_uf) AS endereco_completo
    FROM public.unidades u
    WHERE u.codigo_unidade = codigo_param
    LIMIT 1;
END;
$$;

-- Ferramenta 2: Obter detalhes de um franqueado pelo CPF
CREATE OR REPLACE FUNCTION get_franchisee_details_by_cpf(cpf_param TEXT)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    cpf TEXT,
    email TEXT,
    telefone TEXT,
    tipo TEXT,
    status TEXT,
    unidades_vinculadas JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.nome,
        f.cpf,
        f.email,
        f.telefone,
        f.tipo,
        f.status,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'codigo_unidade', u.codigo_unidade,
                    'nome_unidade', u.nome_padrao
                )
            ) FILTER (WHERE u.id IS NOT NULL),
            '[]'::jsonb
        ) AS unidades_vinculadas
    FROM public.franqueados f
    LEFT JOIN public.franqueados_unidades fu ON f.id = fu.franqueado_id
    LEFT JOIN public.unidades u ON fu.unidade_id = u.id
    WHERE f.cpf = cpf_param
    GROUP BY f.id
    LIMIT 1;
END;
$$;

-- Ferramenta 3: Obter estatísticas gerais do sistema
CREATE OR REPLACE FUNCTION get_system_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_unidades', (SELECT COUNT(*) FROM public.unidades),
        'unidades_ativas', (SELECT COUNT(*) FROM public.unidades WHERE status = 'OPERAÇÃO'),
        'total_franqueados', (SELECT COUNT(*) FROM public.franqueados),
        'franqueados_ativos', (SELECT COUNT(*) FROM public.franqueados WHERE status = 'ativo'),
        'cobrancas_em_aberto', (SELECT COUNT(*) FROM public.cobrancas WHERE status NOT IN ('pago', 'cancelado')),
        'valor_total_em_aberto', (SELECT SUM(valor_atualizado) FROM public.cobrancas WHERE status NOT IN ('pago', 'cancelado'))
    ) INTO stats;
    RETURN stats;
END;
$$;

-- Passo 2: Atualizar o prompt do agente de chat para incluir as ferramentas
UPDATE public.ia_prompts
SET
    prompt_base = 'Você é um assistente de IA para o sistema de gestão financeira da Cresci e Perdi. Sua função é responder perguntas dos usuários internos.

REGRAS PRINCIPAIS:
1.  **USE FERRAMENTAS:** Para responder perguntas sobre dados do sistema (unidades, franqueados, estatísticas), você DEVE usar as ferramentas disponíveis.
2.  **PROCESSO DE FERRAMENTAS:**
    a. Primeiro, avalie a pergunta do usuário. Se precisar de dados, decida qual ferramenta usar.
    b. Responda APENAS com um JSON no formato: `{"tool_name": "nome_da_ferramenta", "parameters": {"param1": "valor1"}}`. Não adicione nenhum outro texto.
    c. Você receberá o resultado da ferramenta. Use essa informação para formular uma resposta final, clara e amigável para o usuário.
3.  **NÃO EXECUTE AÇÕES:** Você só pode consultar dados. Não crie, altere ou delete nada.
4.  **SEJA CONCISO:** Forneça respostas diretas.
5.  **NÃO INVENTE:** Se não encontrar a informação, mesmo com as ferramentas, informe que não foi possível localizar os dados.

# FERRAMENTAS DISPONÍVEIS

1.  **`get_system_stats()`**
    - **Descrição:** Retorna estatísticas gerais do sistema.
    - **Parâmetros:** Nenhum.
    - **Exemplo de uso:** Para perguntas como "quantas unidades temos no total?" ou "qual o valor total em aberto?".
    - **JSON de chamada:** `{"tool_name": "get_system_stats", "parameters": {}}`

2.  **`get_unit_details_by_code(codigo_param)`**
    - **Descrição:** Busca os detalhes completos de uma unidade específica pelo seu código de 4 dígitos.
    - **Parâmetros:** `codigo_param` (string, ex: "1659").
    - **Exemplo de uso:** Para perguntas como "qual o CNPJ da unidade 1659?" ou "me dê os detalhes da unidade 0001".
    - **JSON de chamada:** `{"tool_name": "get_unit_details_by_code", "parameters": {"codigo_param": "1659"}}`

3.  **`get_franchisee_details_by_cpf(cpf_param)`**
    - **Descrição:** Busca os detalhes de um franqueado pelo seu CPF.
    - **Parâmetros:** `cpf_param` (string, ex: "12345678900").
    - **Exemplo de uso:** Para perguntas como "quais unidades o franqueado com CPF 123.456.789-00 gerencia?".
    - **JSON de chamada:** `{"tool_name": "get_franchisee_details_by_cpf", "parameters": {"cpf_param": "12345678900"}}`

---
Agora, avalie a pergunta do usuário e, se necessário, chame uma ferramenta.'
WHERE nome_agente = 'agente_chat_interno';