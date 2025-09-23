-- Função para gerar código único de 4 dígitos para unidades
-- Seguindo o padrão da Cresci e Perdi: códigos de 4 dígitos únicos

CREATE OR REPLACE FUNCTION generate_unique_unit_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 9999; -- 0000 a 9999
BEGIN
    LOOP
        -- Gerar código de 4 dígitos aleatório
        new_code := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Verificar se o código já existe
        SELECT EXISTS(
            SELECT 1 FROM unidades 
            WHERE codigo_unidade = new_code
        ) INTO code_exists;
        
        -- Se não existe, retornar o código
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
        
        -- Incrementar contador de tentativas
        attempt_count := attempt_count + 1;
        
        -- Se esgotar as tentativas, buscar sequencialmente
        IF attempt_count >= 100 THEN
            -- Buscar o primeiro código disponível sequencialmente
            FOR i IN 0..max_attempts LOOP
                new_code := LPAD(i::TEXT, 4, '0');
                
                SELECT EXISTS(
                    SELECT 1 FROM unidades 
                    WHERE codigo_unidade = new_code
                ) INTO code_exists;
                
                IF NOT code_exists THEN
                    RETURN new_code;
                END IF;
            END LOOP;
            
            -- Se chegou aqui, todos os códigos estão em uso
            RAISE EXCEPTION 'Todos os códigos de unidade (0000-9999) estão em uso';
        END IF;
    END LOOP;
END;
$$;

-- Função para validar se um código de unidade é válido
CREATE OR REPLACE FUNCTION validate_unit_code(code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se é exatamente 4 dígitos
    IF code !~ '^\d{4}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se está na faixa válida (0000-9999)
    IF code::INTEGER < 0 OR code::INTEGER > 9999 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Trigger para gerar automaticamente o código ao inserir uma nova unidade
CREATE OR REPLACE FUNCTION auto_generate_unit_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se código não foi fornecido ou está vazio, gerar automaticamente
    IF NEW.codigo_unidade IS NULL OR NEW.codigo_unidade = '' THEN
        NEW.codigo_unidade := generate_unique_unit_code();
    ELSE
        -- Se código foi fornecido, validar
        IF NOT validate_unit_code(NEW.codigo_unidade) THEN
            RAISE EXCEPTION 'Código de unidade inválido: %. Deve ser 4 dígitos (0000-9999)', NEW.codigo_unidade;
        END IF;
        
        -- Verificar se já existe
        IF EXISTS(SELECT 1 FROM unidades WHERE codigo_unidade = NEW.codigo_unidade AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)) THEN
            RAISE EXCEPTION 'Código de unidade % já está em uso', NEW.codigo_unidade;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_auto_generate_unit_code ON unidades;

-- Criar o trigger
CREATE TRIGGER trigger_auto_generate_unit_code
    BEFORE INSERT OR UPDATE ON unidades
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_unit_code();

-- Conceder permissões
GRANT EXECUTE ON FUNCTION generate_unique_unit_code() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_unit_code(TEXT) TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION generate_unique_unit_code() IS 'Gera um código único de 4 dígitos para unidades da Cresci e Perdi';
COMMENT ON FUNCTION validate_unit_code(TEXT) IS 'Valida se um código de unidade está no formato correto (4 dígitos)';
COMMENT ON FUNCTION auto_generate_unit_code() IS 'Trigger function para gerar automaticamente códigos de unidade';
