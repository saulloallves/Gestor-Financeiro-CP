# Sistema de Login - Central Financeira Autônoma

## Visão Geral

Este sistema implementa um modelo de tela de login com duas abas distintas:

- **Acesso Interno**: Para equipe administrativa (Cobrança, Gestão, Admin)
- **Acesso Franqueado**: Para franqueados da rede

## Funcionalidades Implementadas

### ✅ Componentes Criados

1. **LoginPage** (`src/pages/LoginPage.tsx`)
   - Interface principal com abas
   - Logo e identidade visual
   - Layout responsivo

2. **FormularioLoginInterno** (`src/components/ui/FormularioLoginInterno.tsx`)
   - Campos: Email e Senha
   - Validação com Zod
   - Integração com React Hook Form

3. **FormularioLoginFranqueado** (`src/components/ui/FormularioLoginFranqueado.tsx`)
   - Campos: Código da Franquia e Senha
   - Validação com Zod
   - Integração com React Hook Form

4. **DashboardPage** (`src/pages/DashboardPage.tsx`)
   - Tela pós-login demonstrativa
   - Exibe informações do usuário logado
   - Botão de logout

### ✅ Estado e Validação

1. **AuthStore** (`src/store/authStore.ts`)
   - Gerenciamento de estado de autenticação com Zustand
   - Persistência local dos dados de login
   - Simulação de login (para desenvolvimento)

2. **Types** (`src/types/auth.ts`)
   - Tipos TypeScript para autenticação
   - Schemas de validação com Zod
   - Interfaces para usuários interno e franqueado

### ✅ Especificações Seguidas

- ✅ **Material UI**: Todos os componentes usam MUI
- ✅ **Tema Centralizado**: Cores e espaçamento do `src/styles/theme.ts`
- ✅ **React Hook Form + Zod**: Formulários com validação
- ✅ **Zustand**: Estado global de autenticação
- ✅ **TanStack Query**: Cliente configurado para requisições
- ✅ **Lucide Icons**: Ícones consistentes
- ✅ **React Hot Toast**: Sistema de notificações
- ✅ **TypeScript**: Tipagem rigorosa

## Como Testar

### Credenciais de Teste

**Acesso Interno:**
- Email: qualquer email válido (ex: `admin@crescieperdi.com.br`)
- Senha: qualquer senha com 6+ caracteres

**Acesso Franqueado:**
- Código: qualquer código com 3+ caracteres (ex: `FR001`)
- Senha: qualquer senha com 6+ caracteres

### Fluxo de Teste

1. Acesse `http://localhost:5173`
2. Escolha uma das abas (Interno ou Franqueado)
3. Preencha os campos com dados válidos
4. Clique em "Acessar Sistema" ou "Acessar Portal"
5. Será redirecionado para o dashboard correspondente
6. Use o botão "Sair" para fazer logout

## Próximos Passos

### 🔄 Integrações Pendentes

1. **Supabase Authentication**
   - Configurar autenticação real
   - Implementar recuperação de senha
   - Validação de credenciais no backend

2. **Roteamento Avançado**
   - Implementar React Router
   - Rotas protegidas
   - Navegação entre páginas

3. **Funcionalidades de Negócio**
   - Painel de cobranças
   - Gestão de franqueados
   - Relatórios e métricas

### 🎨 Melhorias de UI/UX

1. **Animações e Transições**
2. **Loading States Aprimorados**
3. **Modo Dark/Light**
4. **Responsividade Mobile**

## Estrutura do Código

```
src/
├── components/
│   └── ui/
│       ├── FormularioLoginInterno.tsx
│       └── FormularioLoginFranqueado.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── store/
│   └── authStore.ts
├── types/
│   └── auth.ts
├── styles/
│   └── theme.ts
└── App.tsx
```

## Tecnologias Utilizadas

- **React 18** + **TypeScript**
- **Vite** para build e desenvolvimento
- **Material UI v6** para componentes
- **React Hook Form** para gerenciamento de formulários
- **Zod** para validação de esquemas
- **Zustand** para estado global
- **TanStack Query** para gerenciamento de servidor
- **React Hot Toast** para notificações
- **Lucide React** para ícones
