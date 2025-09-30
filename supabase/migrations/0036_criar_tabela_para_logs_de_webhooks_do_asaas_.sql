CREATE TABLE public.asaas_webhook_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      event_type TEXT,
      payment_id TEXT,
      payload JSONB,
      is_processed BOOLEAN DEFAULT FALSE,
      processing_status TEXT,
      error_message TEXT
    );
    
    -- Habilitar RLS para segurança
    ALTER TABLE public.asaas_webhook_logs ENABLE ROW LEVEL SECURITY;
    
    -- Apenas admins podem ver os logs
    CREATE POLICY "Admins can view webhook logs"
    ON public.asaas_webhook_logs FOR SELECT
    TO authenticated
    USING (
      (SELECT perfil FROM public.usuarios_internos WHERE user_id = auth.uid()) = 'admin'
    );