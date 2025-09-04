-- Insert sample franchisees
-- Note: You'll need to create these users in Supabase Auth first, then update the user_id

-- Example franchisees (you'll need to create the auth users first)
-- For now, we'll create placeholder entries that can be updated with real user_ids later

-- This is a template - you'll need to:
-- 1. Create users in Supabase Auth Dashboard
-- 2. Get their user_id 
-- 3. Update this migration with the real user_id values

-- Placeholder insert for franchisee (update user_id after creating auth user)
-- INSERT INTO franqueados (nome, codigo_franquia, nome_fantasia, user_id)
-- VALUES 
-- ('João Silva', 'FR001', 'Cresci e Perdi - Matriz SP', 'USER_ID_HERE'),
-- ('Maria Santos', 'FR002', 'Cresci e Perdi - Filial RJ', 'USER_ID_HERE'),
-- ('Pedro Costa', 'FR003', 'Cresci e Perdi - Filial MG', 'USER_ID_HERE');

-- For now, let's just create a comment with instructions
-- TO CREATE TEST USERS:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create users with these emails:
--    - franqueado1@crescieperdi.com.br (password: 123456)  
--    - franqueado2@crescieperdi.com.br (password: 123456)
--    - franqueado3@crescieperdi.com.br (password: 123456)
-- 3. Copy their user IDs and update this migration

SELECT 'Sample users migration ready - create auth users first' as message;
