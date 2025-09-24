ALTER TABLE public.cobrancas
ADD COLUMN link_pagamento TEXT NULL;

COMMENT ON COLUMN public.cobrancas.link_pagamento IS 'URL da página de pagamento completa do ASAAS (inclui PIX, etc.)';