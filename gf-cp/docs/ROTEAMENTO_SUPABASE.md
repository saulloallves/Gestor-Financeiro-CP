# Sistema de Roteamento e Integração Supabase

## ✅ Implementado

### 🔄 React Router DOM
- **Rotas Configuradas**: Sistema completo de roteamento
- **Rotas Protegidas**: Componente `ProtectedRoute` para controle de acesso
- **Redirecionamentos**: Login automático e navegação baseada em estado

### 🔐 Integração Supabase Auth
- **AuthService**: Camada de API separada do estado (arquitetura limpa)
- **Modo Híbrido**: Suporte tanto para dados simulados quanto Supabase real
- **Tipagem TypeScript**: Types completos para Database e Auth

### 📁 Nova Arquitetura

```
src/
├── api/
│   ├── authService.ts          # Lógica de autenticação
│   └── supabaseClient.ts       # Cliente Supabase configurado
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.tsx  # Rotas protegidas
│   └── ui/
│       ├── FormularioLoginInterno.tsx
│       └── FormularioLoginFranqueado.tsx
├── pages/
│   ├── LoginPage.tsx           # Redirecionamento automático
│   └── DashboardPage.tsx       
├── router/
│   └── index.tsx               # Configuração de rotas
├── store/
│   └── authStore.ts            # Refatorado para usar AuthService
├── types/
│   ├── auth.ts                 # Types de autenticação
│   └── supabase.ts            # Types do banco de dados
└── App.tsx                     # RouterProvider implementado
```

## 🛠️ Funcionalidades

### Rotas Implementadas
- `/` → Redireciona para `/dashboard`
- `/login` → Página de login (redireciona se já logado)
- `/dashboard` → Dashboard geral (protegida)
- `/admin` → Dashboard admin (só usuários internos)
- `/franqueado` → Dashboard franqueados (só franqueados)
- `/unauthorized` → Página de acesso negado
- `*` → Redireciona para dashboard (404 handler)

### Lógica de Autenticação

#### AuthService (Modo Simulado Atual)
- **Login Interno**: Simula diferentes perfis baseado no email
  - `admin@...` → Perfil Administrador
  - `cobranca@...` → Perfil Cobrança
  - `*@...` → Perfil Gestão
- **Login Franqueado**: Simula franqueados baseado no código
- **Validações**: Format checking e error handling

#### AuthStore Refatorado
- **Responsabilidade Única**: Apenas gerencia estado
- **API Calls**: Delegadas para AuthService
- **Persistência**: Mantém login entre sessões
- **Loading States**: Controle completo de estados de carregamento

## 🔄 Transição Supabase Real

### Para Ativar Supabase Real:

1. **Configure o Banco**:
```sql
-- Tabelas necessárias (a serem criadas no Supabase)
CREATE TABLE usuarios_internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  perfil perfil_usuario NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE franqueados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_franquia TEXT UNIQUE NOT NULL,
  nome_fantasia TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

2. **Ative o Código Real**:
No `authService.ts`, descomente as seções marcadas com `// TODO:` e comente o código simulado.

3. **Configure RLS** (Row Level Security):
```sql
-- Políticas de segurança no Supabase
ALTER TABLE usuarios_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE franqueados ENABLE ROW LEVEL SECURITY;
```

## 🎯 Benefícios da Nova Arquitetura

### ✅ Separação de Responsabilidades
- **Store**: Apenas estado
- **Service**: Apenas API calls
- **Components**: Apenas UI

### ✅ Testabilidade
- AuthService pode ser mockado facilmente
- Store isolado da lógica de rede
- Componentes puros focados em UI

### ✅ Escalabilidade
- Fácil adição de novos endpoints
- Reutilização de lógica entre componentes
- Tipagem consistente

### ✅ Manutenibilidade
- Código organizado por responsabilidade
- Fácil debugging (erros isolados por camada)
- Documentação clara de cada camada

## 🚀 Como Testar

### Login Interno
- Email: `admin@teste.com` → Perfil Admin
- Email: `cobranca@teste.com` → Perfil Cobrança  
- Email: `gestao@teste.com` → Perfil Gestão
- Senha: qualquer com 6+ caracteres

### Login Franqueado
- Código: `FR001` → Cresci e Perdi - Matriz SP
- Código: `FR002` → Cresci e Perdi - Filial RJ
- Código: `FR003` → Cresci e Perdi - Filial MG
- Senha: qualquer com 6+ caracteres

### Fluxo de Navegação
1. Acesse `/` → Redireciona para `/dashboard`
2. Não logado → Redireciona para `/login`
3. Faça login → Redireciona automaticamente para `/dashboard`
4. Tente acessar `/admin` sem ser interno → Vai para `/unauthorized`

## 📈 Próximos Passos

1. **Criar tabelas no Supabase**
2. **Configurar RLS e políticas de segurança**
3. **Ativar autenticação real**
4. **Implementar recuperação de senha**
5. **Adicionar mais rotas (relatórios, configurações, etc.)**
