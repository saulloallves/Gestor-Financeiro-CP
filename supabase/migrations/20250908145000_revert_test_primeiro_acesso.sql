-- Migração para reverter usuário Marcus ao estado normal
-- Remove a simulação de primeiro acesso para que ele funcione normalmente

-- ==============================================
-- REVERTER SIMULAÇÃO DE PRIMEIRO ACESSO
-- ==============================================

-- Marcar o usuário Marcus como usuário normal (não primeiro acesso)
UPDATE usuarios_internos 
SET 
    primeiro_acesso = false,
    senha_temporaria = false,
    data_ultima_senha = NOW(),
    updated_at = NOW()
WHERE email = 'marcus.vinicius@crescieperdi.com.br';

-- ==============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ==============================================

-- Esta migração reverte a simulação de primeiro acesso
-- Agora o usuário Marcus pode usar o sistema normalmente
-- Novos usuários criados através da função create_usuario_interno() 
-- já terão primeiro_acesso = true automaticamente
