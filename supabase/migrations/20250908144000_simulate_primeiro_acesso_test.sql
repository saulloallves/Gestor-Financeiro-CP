-- Migração para simular primeiro acesso do usuário Marcus para testes
-- Isso permitirá testar o fluxo de primeiro acesso

-- ==============================================
-- SIMULAR PRIMEIRO ACESSO PARA TESTE
-- ==============================================

-- Marcar o usuário Marcus como precisando fazer primeiro acesso
UPDATE usuarios_internos 
SET 
    primeiro_acesso = true,
    senha_temporaria = true,
    data_criacao = NOW(),
    data_ultima_senha = NULL,
    updated_at = NOW()
WHERE email = 'marcus.vinicius@crescieperdi.com.br';

-- ==============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

-- Esta migração simula um usuário que acabou de ser criado
-- e precisa fazer o primeiro acesso obrigatório com troca de senha
-- Para reverter: UPDATE usuarios_internos SET primeiro_acesso = false, senha_temporaria = false WHERE email = 'marcus.vinicius@crescieperdi.com.br';
