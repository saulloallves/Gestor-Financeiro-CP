-- Migration: Migrar usuarios_internos.perfil para novo enum perfil_usuario_enum
-- Data: 2025-09-05

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario_enum') THEN
    CREATE TYPE perfil_usuario_enum AS ENUM ('operador', 'gestor', 'juridico', 'admin');
  END IF;
END $$;

-- Dropar políticas que referenciam usuarios_internos.perfil para permitir alteração do tipo
DROP POLICY IF EXISTS "Admins can view all units" ON unidades;
DROP POLICY IF EXISTS "Admins can view all internal users" ON usuarios_internos;
DROP POLICY IF EXISTS "Gestores can manage units" ON unidades;
DROP POLICY IF EXISTS "Admins can view all franchisees" ON franqueados;
DROP POLICY IF EXISTS "Admins can view all charges" ON cobrancas;

DROP FUNCTION IF EXISTS get_internal_user_data(UUID);
DROP FUNCTION IF EXISTS create_usuario_interno_with_auth(TEXT, TEXT, TEXT, TEXT, UUID, TEXT);

DO $$
DECLARE
    r RECORD;
    expr TEXT;
BEGIN
    FOR r IN 
        SELECT p.polname, n.nspname AS schemaname, c.relname AS tablename,
                     pg_get_expr(p.polqual, c.oid) AS qual,
                     pg_get_expr(p.polwithcheck, c.oid) AS withcheck
        FROM pg_policy p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
    LOOP
        expr := coalesce(r.qual, '') || ' ' || coalesce(r.withcheck, '');
        IF position('usuarios_internos' IN expr) > 0 AND position('perfil' IN expr) > 0 THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.polname, r.schemaname, r.tablename);
        END IF;
    END LOOP;
END $$;

ALTER TABLE usuarios_internos ALTER COLUMN perfil TYPE TEXT USING perfil::text;

UPDATE usuarios_internos
SET perfil = CASE perfil
  WHEN 'gestao' THEN 'gestor'
  WHEN 'cobranca' THEN 'operador'
  WHEN 'admin' THEN 'admin'
  ELSE 'operador'
END;

ALTER TABLE usuarios_internos ALTER COLUMN perfil TYPE perfil_usuario_enum USING perfil::perfil_usuario_enum;

CREATE OR REPLACE FUNCTION get_internal_user_data(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    email TEXT,
    perfil perfil_usuario_enum
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id,
        ui.nome,
        ui.email,
        ui.perfil
    FROM usuarios_internos ui
    WHERE ui.user_id = user_uuid;
END;
$$;

GRANT EXECUTE ON FUNCTION get_internal_user_data(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION create_usuario_interno_with_auth(
    p_nome TEXT,
    p_email TEXT,
    p_telefone TEXT DEFAULT NULL,
    p_perfil TEXT DEFAULT 'operador',
    p_equipe_id UUID DEFAULT NULL,
    p_senha TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_password TEXT;
    v_senha_final TEXT;
    v_resultado JSON;
    v_usuario_interno_id UUID;
    v_perfil_final TEXT;
BEGIN
    IF p_perfil NOT IN ('operador', 'gestor', 'juridico', 'admin') THEN
        RAISE EXCEPTION 'Perfil inválido. Use: operador, gestor, juridico ou admin';
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users au WHERE au.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está em uso', p_email;
    END IF;

    IF EXISTS (SELECT 1 FROM usuarios_internos ui WHERE ui.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está cadastrado como usuário interno', p_email;
    END IF;

    IF EXISTS (SELECT 1 FROM franqueados f WHERE f.email = p_email) THEN
        RAISE EXCEPTION 'Email % já está cadastrado como franqueado', p_email;
    END IF;

    IF p_senha IS NULL OR p_senha = '' THEN
        v_senha_final := substring(md5(random()::text) from 1 for 8) || 'A1!';
    ELSE
        v_senha_final := p_senha;
    END IF;

    v_user_id := gen_random_uuid();
    v_usuario_interno_id := gen_random_uuid();
    v_encrypted_password := crypt(v_senha_final, gen_salt('bf'));

    BEGIN
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            last_sign_in_at
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated',
            'authenticated',
            p_email,
            v_encrypted_password,
            NOW(),
            '',
            '',
            '',
            '',
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            FALSE,
            NULL
        );

        INSERT INTO usuarios_internos (
            id,
            user_id,
            nome,
            email,
            telefone,
            perfil,
            equipe_id,
            status,
            created_at,
            updated_at
        ) VALUES (
            v_usuario_interno_id,
            v_user_id,
            p_nome,
            p_email,
            p_telefone,
            p_perfil::perfil_usuario_enum,
            p_equipe_id,
            'ativo',
            NOW(),
            NOW()
        );

        v_resultado := json_build_object(
            'success', true,
            'user_id', v_user_id,
            'usuario_interno_id', v_usuario_interno_id,
            'email', p_email,
            'senha_temporaria', v_senha_final,
            'message', 'Usuário criado com sucesso'
        );

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro ao criar usuário: %', SQLERRM;
    END;

    RETURN v_resultado;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Erro ao criar usuário interno'
        );
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario') THEN
    DROP TYPE perfil_usuario;
  END IF;
END $$;

-- Recriar políticas RLS removidas
CREATE POLICY "Admins can view all internal users" ON usuarios_internos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );

CREATE POLICY "Admins can view all units" ON unidades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );

CREATE POLICY "Admins can view all franchisees" ON franqueados
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );

CREATE POLICY "Admins can view all charges" ON cobrancas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios_internos ui 
            WHERE ui.user_id = auth.uid() 
            AND ui.perfil = 'admin'
        )
    );

COMMIT;
