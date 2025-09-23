-- Adicionar colunas de foto_perfil se não existirem

-- Verificar e adicionar foto_perfil na tabela usuarios_internos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios_internos' 
                   AND column_name = 'foto_perfil') THEN
        ALTER TABLE usuarios_internos ADD COLUMN foto_perfil TEXT;
    END IF;
END $$;

-- Verificar e adicionar foto_perfil na tabela franqueados
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'franqueados' 
                   AND column_name = 'foto_perfil') THEN
        ALTER TABLE franqueados ADD COLUMN foto_perfil TEXT;
    END IF;
END $$;

-- Criar bucket para avatars no storage se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Dropar políticas existentes se existirem
DROP POLICY IF EXISTS "Usuários podem fazer upload de suas próprias fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias fotos" ON storage.objects;

-- Política para permitir que usuários autenticados façam upload de suas próprias fotos
CREATE POLICY "Usuários podem fazer upload de suas próprias fotos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários autenticados vejam suas próprias fotos
CREATE POLICY "Usuários podem ver suas próprias fotos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários autenticados atualizem suas próprias fotos
CREATE POLICY "Usuários podem atualizar suas próprias fotos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir que usuários autenticados deletem suas próprias fotos
CREATE POLICY "Usuários podem deletar suas próprias fotos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);