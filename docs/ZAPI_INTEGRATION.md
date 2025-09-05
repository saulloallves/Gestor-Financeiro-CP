# Integração Z-API via Supabase Edge Function

Este documento descreve como configurar os segredos e usar o serviço `zapiService` para enviar mensagens de texto via WhatsApp.

## Secrets no Supabase

Configure os seguintes segredos na sua instância do Supabase (CLI ou Dashboard):

- `ZAPI_INSTANCE_ID`
- `ZAPI_INSTANCE_TOKEN`
- `ZAPI_CLIENT_TOKEN` (obrigatório para o header Client-Token)
- `ZAPI_BASE_URL` (opcional; default `https://api.z-api.io`)

### Via CLI

Opcional para rodar localmente:

```bash
supabase functions secrets set ZAPI_INSTANCE_ID=... ZAPI_INSTANCE_TOKEN=... ZAPI_CLIENT_TOKEN=... ZAPI_BASE_URL=https://api.z-api.io
```

## Deploy da função

- Desenvolvimento local:
  - supabase functions serve zapi-send-text
- Deploy (em produção):
  - supabase functions deploy zapi-send-text

## Uso no frontend

No código do app:

import { sendWhatsAppText } from '@/api/zapiService';

await sendWhatsAppText({
  phone: '5511999999999',
  message: 'Olá! Sua mensagem aqui.'
});

A função apenas realiza o disparo; formatação do número e composição da mensagem devem ocorrer no app antes de invocar a função.
