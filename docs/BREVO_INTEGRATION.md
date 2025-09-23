# Integração Brevo Email via Supabase Edge Function

Este documento descreve como configurar os segredos e usar o serviço `emailService` para enviar emails via API Brevo.

## Secrets no Supabase

Configure os seguintes segredos na sua instância do Supabase (CLI ou Dashboard):

- `BREVO_API_KEY` (obrigatório - chave da API Brevo)
- `BREVO_DEFAULT_FROM` (opcional; default `noreply@crescieperdi.com.br`)
- `BREVO_DEFAULT_FROM_NAME` (opcional; default `Sistema Cresci e Perdi`)

### Via CLI

```bash
supabase functions secrets set BREVO_API_KEY=... BREVO_DEFAULT_FROM=noreply@crescieperdi.com.br BREVO_DEFAULT_FROM_NAME="Sistema Cresci e Perdi"
```

## Deploy da função

- Desenvolvimento local:
  - `supabase functions serve brevo-send-email`
- Deploy (em produção):
  - `supabase functions deploy brevo-send-email`

## Uso no frontend

### Envio básico

```typescript
import { sendEmail } from '@/api/emailService';

await sendEmail({
  to: 'cliente@email.com',
  subject: 'Assunto do email',
  html: '<h1>Conteúdo HTML</h1>',
  text: 'Conteúdo em texto plano'
});
```

### Múltiplos destinatários

```typescript
await sendEmail({
  to: ['cliente1@email.com', 'cliente2@email.com'],
  subject: 'Email para múltiplos destinatários',
  html: '<p>Conteúdo do email</p>'
});
```

### Usando helpers do sistema

```typescript
import { sendSystemEmail, sendNotificationEmail } from '@/api/emailService';

// Email do sistema
await sendSystemEmail(
  'usuario@email.com',
  'Bem-vindo ao sistema',
  '<h1>Bem-vindo!</h1><p>Seu cadastro foi realizado com sucesso.</p>'
);

// Email de notificação
await sendNotificationEmail(
  'gestor@email.com',
  'Nova cobrança cadastrada',
  'Uma nova cobrança foi cadastrada no sistema e requer sua atenção.'
);
```

## Estrutura do payload

- `to`: string ou array de strings com emails destinatários
- `subject`: assunto do email (obrigatório)
- `html`: conteúdo HTML (opcional se `text` for fornecido)
- `text`: conteúdo texto plano (opcional se `html` for fornecido)
- `from`: email remetente (opcional, usa default)
- `fromName`: nome do remetente (opcional, usa default)

## Respostas

### Sucesso

```typescript
{
  success: true,
  messageId: "string", // ID da mensagem no Brevo
  data: object // dados retornados pela API Brevo
}
```

### Erro

```typescript
{
  success: false,
  error: "string", // mensagem de erro
  status: number // código HTTP de erro
}
```

## Exemplo de teste via curl

```bash
curl -X POST "https://SEU_PROJECT.supabase.co/functions/v1/brevo-send-email" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "apikey: SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "teste@email.com",
    "subject": "Teste de email",
    "html": "<h1>Teste</h1><p>Este é um teste de email via Brevo.</p>",
    "text": "Teste\n\nEste é um teste de email via Brevo."
  }'
```
