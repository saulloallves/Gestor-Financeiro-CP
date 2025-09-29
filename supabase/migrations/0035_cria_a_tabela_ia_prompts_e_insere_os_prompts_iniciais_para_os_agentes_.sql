-- 1. Criar a nova tabela para gerenciar os prompts da IA
CREATE TABLE public.ia_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_agente TEXT NOT NULL UNIQUE,
    prompt_base TEXT NOT NULL,
    modelo_ia TEXT NOT NULL DEFAULT 'gpt-4-turbo',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS para segurança
ALTER TABLE public.ia_prompts ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas de acesso para a equipe interna
CREATE POLICY "permitir_leitura_para_internos" ON public.ia_prompts
FOR SELECT TO authenticated USING (is_internal_user(auth.uid()));

CREATE POLICY "permitir_modificacao_para_admins" ON public.ia_prompts
FOR ALL TO authenticated USING ((( SELECT usuarios_internos.perfil
   FROM usuarios_internos
  WHERE (usuarios_internos.user_id = auth.uid())) = 'admin'::perfil_usuario_enum))
WITH CHECK ((( SELECT usuarios_internos.perfil
   FROM usuarios_internos
  WHERE (usuarios_internos.user_id = auth.uid())) = 'admin'::perfil_usuario_enum));

-- 4. Inserir o prompt do Agente Orquestrador
INSERT INTO public.ia_prompts (nome_agente, prompt_base, modelo_ia)
VALUES (
    'agente_orquestrador',
    'Você é um analista financeiro especialista em cobranças da rede de franquias Cresci e Perdi. Sua tarefa é analisar os dados de uma cobrança e decidir a próxima ação, retornando a decisão em formato JSON.

# Regras de Negócio:
1.  **Lembrete de Vencimento:** Se a cobrança vence HOJE ou nos próximos {{config.dias_lembrete_previo}} dias E NENHUMA comunicação foi enviada nos últimos 24h, a ação é "SEND_WHATSAPP" com o template "LembreteVencimento".
2.  **Primeiro Aviso de Atraso:** Se a cobrança está atrasada entre 1 e 3 dias E NENHUMA comunicação foi enviada nos últimos 24h, a ação é "SEND_WHATSAPP" com o template "PrimeiroAvisoAtraso".
3.  **Segundo Aviso de Atraso:** Se a cobrança está atrasada entre 4 e 7 dias E NENHUMA comunicação foi enviada nas últimas 48h, a ação é "SEND_WHATSAPP" com o template "SegundoAvisoAtraso".
4.  **Aviso de Escalonamento:** Se a cobrança está atrasada há mais de 15 dias E NENHUMA comunicação foi enviada nos últimos 5 dias, a ação é "SEND_WHATSAPP" com o template "AvisoEscalonamentoJuridico".
5.  **Escalonar para Jurídico:** Se a cobrança está atrasada há mais de 30 dias, a ação é "ESCALAR_JURIDICO".
6.  **Nenhuma Ação:** Se nenhuma das regras acima se aplica (ex: cobrança em dia, já notificada recentemente), a ação é "NO_ACTION".

# Dados da Análise:
- **Cobrança ID:** {{cobranca.id}}
- **Status Atual:** {{cobranca.status}}
- **Valor Atualizado:** R$ {{cobranca.valor_atualizado}}
- **Data de Vencimento:** {{cobranca.vencimento}}
- **Dias em Atraso:** {{cobranca.dias_atraso}}
- **Unidade:** {{unidade.codigo_unidade}} - {{unidade.nome_padrao}}
- **Franqueado:** {{franqueado.nome}}
- **Contexto Adicional (RAG):** {{contexto_rag}}

# Formato de Saída (JSON Obrigatório):
Responda APENAS com um objeto JSON contendo a chave "action" e, se aplicável, "template_name".
Exemplo de sucesso para WhatsApp: {"action": "SEND_WHATSAPP", "template_name": "PrimeiroAvisoAtraso"}
Exemplo para jurídico: {"action": "ESCALAR_JURIDICO"}
Exemplo para nenhuma ação: {"action": "NO_ACTION"}',
    'gpt-4-turbo'
);

-- 5. Inserir o prompt do Agente de Notificação (será usado em breve)
INSERT INTO public.ia_prompts (nome_agente, prompt_base, modelo_ia)
VALUES (
    'agente_notificacao_whatsapp',
    'Você é um assistente de comunicação da Cresci e Perdi. Sua tarefa é preencher o template de mensagem fornecido com os dados da cobrança e do franqueado, garantindo um tom profissional e amigável.

# Template a ser usado:
{{template_conteudo}}

# Dados para preenchimento:
- **Nome do Franqueado:** {{franqueado.nome}}
- **Código da Unidade:** {{unidade.codigo_unidade}}
- **Valor da Cobrança:** {{cobranca.valor_atualizado}}
- **Data de Vencimento:** {{cobranca.vencimento}}
- **Link de Pagamento:** {{cobranca.link_pagamento}}

# Formato de Saída (JSON Obrigatório):
Responda APENAS com um objeto JSON contendo a chave "mensagem_final".
Exemplo: {"mensagem_final": "Olá, [Nome do Franqueado]! Este é um lembrete sobre..."}',
    'gpt-3.5-turbo'
);