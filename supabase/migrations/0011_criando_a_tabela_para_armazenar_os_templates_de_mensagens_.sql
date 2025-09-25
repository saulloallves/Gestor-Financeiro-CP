-- Criar a tabela de templates
    CREATE TABLE public.templates (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      nome TEXT NOT NULL,
      canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email')),
      conteudo TEXT NOT NULL,
      criado_por UUID REFERENCES auth.users(id),
      data_criacao TIMESTAMPTZ DEFAULT now(),
      ativo BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Habilitar RLS
    ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

    -- Políticas de Segurança: Apenas usuários internos autenticados podem gerenciar templates
    CREATE POLICY "Permitir leitura para usuários internos" ON public.templates FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Permitir inserção para gestores e admins" ON public.templates FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM usuarios_internos WHERE user_id = auth.uid() AND perfil IN ('gestor', 'admin'))
    );
    CREATE POLICY "Permitir atualização para gestores e admins" ON public.templates FOR UPDATE TO authenticated USING (
      EXISTS (SELECT 1 FROM usuarios_internos WHERE user_id = auth.uid() AND perfil IN ('gestor', 'admin'))
    );