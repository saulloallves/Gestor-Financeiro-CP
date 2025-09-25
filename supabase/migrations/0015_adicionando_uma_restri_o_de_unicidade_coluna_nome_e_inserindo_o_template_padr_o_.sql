-- 1. Adicionar a restrição UNIQUE na coluna 'nome' para permitir o uso de ON CONFLICT.
-- Isso garante que não teremos templates com nomes duplicados.
ALTER TABLE public.templates
ADD CONSTRAINT templates_nome_unique UNIQUE (nome);

-- 2. Agora, com a restrição no lugar, podemos inserir o template com segurança.
-- O ON CONFLICT agora funcionará como esperado.
INSERT INTO public.templates (nome, canal, conteudo, ativo)
VALUES (
  'cobranca_atrasada_whatsapp_01',
  'whatsapp',
  'Olá, {{franqueado.nome}}! 👋\n\nIdentificamos que a cobrança referente à sua unidade *{{unidade.codigo_unidade}}* está em atraso.\n\n*Vencimento Original:* {{cobranca.vencimento}}\n*Valor Atualizado:* R$ {{cobranca.valor_atualizado}}\n\nPara regularizar, por favor, utilize o link de pagamento abaixo:\n{{cobranca.link_pagamento}}\n\nCaso já tenha efetuado o pagamento, por favor, desconsidere. Se precisar de ajuda ou desejar negociar, basta responder a esta mensagem. 📲\n\nAtenciosamente,\nEquipe Financeira Cresci e Perdi',
  true
)
ON CONFLICT (nome) DO NOTHING; -- Evita erro se o template já existir