-- Criação do tipo ENUM para provedores de IA
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'provedor_ia') THEN
        CREATE TYPE public.provedor_ia AS ENUM ('openai', 'lambda', 'google_gemini');
    END IF;
END
$$;

-- Tabela: configuracoes
-- Tabela única para armazenar todas as configurações do sistema.
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    -- Configurações de Cobrança
    taxa_juros_diaria DECIMAL(5, 4) DEFAULT 0.00033,
    valor_multa_atraso DECIMAL(10, 2) DEFAULT 50.00,
    maximo_juros_acumulado DECIMAL(10, 2) DEFAULT 500.00,
    dias_desconto_antecipado INT DEFAULT 5,
    desconto_antecipado DECIMAL(5, 2) DEFAULT 0.05,
    
    -- Configurações do Provedor de IA
    ia_provedor public.provedor_ia DEFAULT 'openai',
    ia_modelo TEXT DEFAULT 'gpt-4-turbo',
    ia_api_key TEXT, -- Será armazenado de forma segura
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir registro padrão se a tabela estiver vazia
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.configuracoes) THEN
        INSERT INTO public.configuracoes DEFAULT VALUES;
    END IF;
END
$$;

-- Adicionar colunas de IA se não existirem (para migrações não destrutivas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes' AND column_name='ia_provedor') THEN
        ALTER TABLE public.configuracoes ADD COLUMN ia_provedor public.provedor_ia DEFAULT 'openai';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes' AND column_name='ia_modelo') THEN
        ALTER TABLE public.configuracoes ADD COLUMN ia_modelo TEXT DEFAULT 'gpt-4-turbo';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='configuracoes' AND column_name='ia_api_key') THEN
        ALTER TABLE public.configuracoes ADD COLUMN ia_api_key TEXT;
    END IF;
END
$$;

-- Renomear tabela antiga se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracoes_cobrancas') THEN
        -- Copiar dados antes de dropar
        UPDATE public.configuracoes SET
            taxa_juros_diaria = old.taxa_juros_diaria,
            valor_multa_atraso = old.valor_multa_atraso,
            maximo_juros_acumulado = old.maximo_juros_acumulado,
            dias_desconto_antecipado = old.dias_desconto,
            desconto_antecipado = old.desconto_antecipado
        FROM configuracoes_cobrancas old
        WHERE public.configuracoes.id = 1;

        DROP TABLE public.configuracoes_cobrancas;
    END IF;
END
$$;

-- Políticas de Segurança (RLS)
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.configuracoes;
CREATE POLICY "Permitir leitura para usuários autenticados"
ON public.configuracoes FOR SELECT
TO authenticated
USING (true);

-- DROP POLICY IF EXISTS "Permitir atualização para admins" ON public.configuracoes;
-- CREATE POLICY "Permitir atualização para admins"
-- ON public.configuracoes FOR UPDATE
-- USING ((get_user_perfil(auth.uid()) = 'admin'))
-- WITH CHECK ((get_user_perfil(auth.uid()) = 'admin'));

-- Trigger para atualizar 'updated_at'
CREATE OR REPLACE FUNCTION public.handle_update_configuracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_configuracoes_updated ON public.configuracoes;
CREATE TRIGGER on_configuracoes_updated
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.handle_update_configuracoes_updated_at();
