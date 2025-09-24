# AI Development Rules - Gestor Financeiro CP

---

## ⚠️ LEIA ANTES DE QUALQUER ALTERAÇÃO

Antes de toda e qualquer alteração ou criação de código, leia atentamente este documento. Ele contém todas as diretrizes, padrões e regras que devem ser seguidas para garantir a qualidade, consistência e manutenibilidade do projeto.

---

## 1. Visão Geral do Projeto

Estamos construindo a **"Central Financeira Autônoma com IA"**. É um sistema de gestão de cobranças e contas a receber para uma rede de franqueados.

- **Objetivo Principal:** Automatizar 90% do processo de cobrança, utilizando uma IA para negociar, enviar boletos e agendar reuniões, visando reduzir a inadimplência e aumentar a eficiência da equipe.
- **Usuários:** A plataforma terá dois tipos de acesso: um painel administrativo para a equipe interna (Cobrança, Gestão) e um portal de autoatendimento para os franqueados.
- **Tecnologia Core:** O frontend é um SPA (Single Page Application) em **React com Vite e TypeScript**, e o backend é a plataforma **Supabase**.

---

## 2. Stack de Tecnologias Principal

Ao gerar código, priorize sempre o uso das seguintes bibliotecas e ferramentas:

- **UI Components:** **Material UI (MUI)**. **REGRA DE OURO:** Sempre use componentes do MUI (`<Button>`, `<Card>`, `<TextField>`, `<DataGrid>`) para construir a interface. Não use tags HTML puras (como `<button>`) para elementos de UI.
- **Estado do Servidor:** **TanStack Query (React Query)**. Toda busca e mutação de dados do Supabase deve ser gerenciada através dos hooks `useQuery` e `useMutation`. Isso garante caching, revalidação e um controle de estado de loading/error eficiente.
- **Estado Global (Cliente):** **Zustand**. Para estado global simples que não vem do servidor (ex: dados do usuário logado, estado da UI como menus), use Zustand pela sua simplicidade.
- **Formulários:** A combinação de **React Hook Form** (`useForm`) para o gerenciamento do estado dos formulários e **Zod** para a validação dos schemas.
- **Ícones:** Use a biblioteca **lucide-react**.
- **Notificações:** Use a biblioteca **react-hot-toast**.
- **Roteamento:** Use **react-router-dom**.
- **Backend Client:** Use o cliente **@supabase/supabase-js** para todas as interações com o banco de dados e as funções do Supabase.

---

## 3. Sistema de Design e Estilização (MUITO IMPORTANTE)

Toda a identidade visual do projeto é controlada por um único arquivo de tema.

- **Arquivo Central:** `src/styles/theme.ts`.
- **Fonte Principal:** **Poppins**. A tipografia já está configurada neste arquivo.
- **Cores:** Todas as cores da marca (primary, secondary, error, etc.) estão definidas na `palette` do tema.

**Diretrizes de Estilização (Regras Inquebráveis):**

1. **NUNCA use cores hard-coded** no código (ex: `color: '#FFF'`, `background: 'red'`).
2. **SEMPRE use as cores do tema**. Exemplo: `sx={{ color: 'primary.main' }}` ou `sx={{ backgroundColor: 'error.dark' }}`.
3. Para estilização, **priorize o uso da prop `sx`** do MUI para overrides pontuais.
4. Para espaçamento, **SEMPRE use a função de espaçamento do tema**: `sx={{ padding: theme.spacing(2) }}`. Não use valores fixos como `'16px'`.
5. A fonte Poppins já é o padrão. Use os componentes `<Typography>` do MUI para aplicar os estilos corretos de cabeçalhos e textos (ex: `<Typography variant="h1">`).

---

## 4. Padrões de Código e Estrutura

Siga rigorosamente a estrutura de pastas pré-definida:

- **`/pages`**: Componentes de página inteira, ligados a uma rota.
- **`/components`**: Componentes reutilizáveis.
    - `/components/ui`: Componentes genéricos (ex: um `StyledCard` customizado).
    - `/components/layout`: Componentes de estrutura (ex: `Sidebar`, `Navbar`).
- **`/api`**: Toda a lógica de chamada a APIs externas (Supabase, Asaas, etc.).
- **`/hooks`**: Hooks customizados para lógica reutilizável.
- **`/types`**: Todas as interfaces e tipos do TypeScript. Seja rigoroso com a tipagem.
- **`/store`**: Nossos stores do Zustand.
- **Nomeclatura:** Use `PascalCase` para nomes de arquivos e componentes React (ex: `CobrancasPage.tsx`) e `camelCase` para funções e variáveis.

---

## 5. Exemplo de um "Bom Componente"

O exemplo abaixo segue todas as nossas regras. Use-o como referência para o estilo de código esperado.

```tsx
import { Box, Button, Typography, Card } from '@mui/material';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '@mui/material/styles';

// Tipagem das props na pasta /types/alerta.ts
interface AlertaProps {
  titulo: string;
  mensagem: string;
  onConfirmar: () => void;
}

// O componente em si, poderia ficar em /components/ui/Alerta.tsx
export function Alerta({ titulo, mensagem, onConfirmar }: AlertaProps) {
  const theme = useTheme(); // Acesso ao tema para espaçamento

  return (
    <Card sx={{ padding: theme.spacing(3), backgroundColor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AlertCircle color={theme.palette.warning.main} />
        <Typography variant="h6" component="h2" sx={{ color: 'text.primary' }}>
          {titulo}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ marginY: 2, color: 'text.secondary' }}>
        {mensagem}
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={onConfirmar}
      >
        Confirmar
      </Button>
    </Card>
  );
}
```

---

## 6. Dicas para o Desenvolvimento

1. **Consistência é chave.** Siga as regras de estilização e estrutura à risca.
2. **Componentização.** Se um pedaço de UI se repete, crie um componente reutilizável.
3. **Tipagem rigorosa.** Sempre defina tipos e interfaces para props, estados e dados.
4. **Documentação.** Comente partes complexas do código para facilitar a manutenção futura.
5. **Testes.** Sempre que possível, escreva testes unitários para componentes críticos.
6. **Revisão de Código.** Antes de finalizar uma feature, revise o código para garantir que todas as diretrizes foram seguidas.
7. **IDE** Ao executar comando no terminal, sempre utilize o operador ";" e não "&&" pois o terminal do Windows não reconhece o "&&", além disso não execute o comando "npm run dev" no terminal do VSCode pois eu já vou estar rodando o projeto no meu computador para testar, só faça isso se eu solicitar.
8. **Supabase** Ao executar comando do supabase CLI, sempre utilize o comando ``supabase`` e não ``npx supabase`` pois eu tenho o supabase CLI instalado globalmente na minha máquina.

---

## 7. Git e Commits

Siga essas diretrizes para versão e commits:
- **Versionamento Semântico (SemVer):** Todas as versões estáveis da aplicação serão marcadas seguindo o padrão `MAJOR.MINOR.PATCH` (ex: `v1.0.0`, `v1.2.1`).
- **Controle de Versão com Git/GitHub:**
    - **Branch `main`:** Contém o código de produção, sempre estável. Apenas versões testadas e marcadas com uma tag podem ser mescladas aqui.
    - **Branch `develop`:** Branch principal de desenvolvimento, onde as novas funcionalidades são integradas.
    - **Tags do Git:** Cada deploy em produção será associado a uma tag imutável no Git (ex: `git tag -a v1.2.0 -m "Release 1.2.0"`). Isso nos dá um ponto de restauração exato e confiável.
- **Mensagens de Commit:** Use mensagens claras e descritivas. Exemplo: `feat: adicionar funcionalidade de filtro na lista de cobranças`, `fix: corrigir bug na validação do formulário de login`.

---

## 8. Comunicação e Feedback

Para garantir que o desenvolvimento esteja alinhado com as expectativas, mantenha uma comunicação constante. Se surgir qualquer dúvida ou se algo não estiver claro, pergunte imediatamente. Feedbacks regulares são essenciais para o sucesso do projeto.

---

## 9. Schemas de Tabelas no Supabase

Sempre siga o schema que está sendo construído via Supabase. Não crie novas tabelas ou campos sem antes consultar o schema atual nas migrations e toda alteração deve ser feita via CLI do Supabase, para garantir a integridade do banco de dados.

---

## 10. Tech Stack Overview

- **Frontend Framework**: React 19 + TypeScript + Vite para desenvolvimento rápido e tipagem forte
- **UI Library**: Material-UI (MUI) v7 exclusivamente - NÃO use outras bibliotecas de UI (shadcn/ui, Ant Design, etc.)
- **State Management**: Zustand para estado global + React Query (TanStack Query) para estado do servidor
- **Database**: Supabase (PostgreSQL) com Row Level Security (RLS) e Edge Functions
- **Forms**: React Hook Form + Zod para validação e gerenciamento de formulários
- **Routing**: React Router DOM v7 com rotas protegidas e controle de acesso por perfil
- **Styling**: Sistema de temas do Material-UI + arquivo central `src/styles/theme.ts` - NÃO use Tailwind CSS
- **Icons**: Lucide React exclusivamente para ícones
- **Date Handling**: date-fns com locale pt-BR para todas as operações de data
- **Notifications**: react-hot-toast para feedback ao usuário e tratamento de erros

---

## 11. Architecture Patterns

### 📁 File Organization Rules
```
src/
├── api/           # Service layer - Supabase clients and API calls
├── components/    # Reusable UI components (MUI-based)
├── hooks/         # Custom React hooks for data fetching
├── pages/         # Route components (one per route)
├── store/         # Zustand stores for global state
├── types/         # TypeScript interfaces and types
├── utils/         # Pure utility functions
└── router/        # React Router configuration
```

### 🔐 Authentication & Authorization
- **Auth Provider**: Supabase Auth com wrapper AuthService customizado
- **Session Management**: Zustand store com persistência
- **Route Protection**: ProtectedRoute com controle de acesso por perfil
- **User Types**: `interno` (equipe) vs `franqueado` (franqueado)

### 🗄️ Data Management Strategy
- **Cache-First Architecture**: Zustand store com cache local para performance
- **Sync Service**: Sincronização em background com bancos externos
- **React Query**: Para dados dinâmicos e que precisam de atualização frequente (cobranças)
- **Local Storage**: Persistência de estado de auth e cache de dados

---

## 12. Proibições e Padrões

### ❌ Forbidden Libraries/Patterns
- **NÃO use Tailwind CSS** - Use apenas o sistema de temas do MUI
- **NÃO use shadcn/ui** - Todos os componentes devem ser Material-UI
- **NÃO use Ant Design, Chakra UI, ou outras bibliotecas de UI**
- **NÃO use CSS-in-JS além do emotion do MUI**
- **NÃO use Redux/RTK** - Use Zustand para estado global
- **NÃO use Axios** - Use o cliente Supabase ou fetch nativo
- **NÃO use moment.js** - Use date-fns exclusivamente

### ❌ Anti-Patterns to Avoid
- **NÃO use estilos inline** - Use a prop `sx` do MUI ou o tema
- **NÃO use cores hard-coded** - Use apenas as cores do tema
- **NÃO faça queries diretas ao banco em componentes** - Use a camada de serviços
- **NÃO use respostas de API sem tipagem** - Sempre defina interfaces TypeScript
- **NÃO misture gerenciamento de estado** - Escolha entre Zustand ou React Query por caso de uso

---

## 13. Padrões Obrigatórios

### 🎨 UI/UX Standards
- **Material-UI Components**: Use apenas componentes do MUI
- **Theme Consistency**: Todas as cores via `theme.palette`, espaçamento via `theme.spacing()`
- **Typography**: Fonte Poppins como padrão
- **Responsive Design**: Use breakpoints e props responsivas do MUI
- **Loading States**: Skeletons e indicadores de loading consistentes
- **Error Handling**: Toasts para feedback ao usuário

### 📊 Data Fetching Patterns
```typescript
// ✅ CORRETO: Service layer com React Query
const { data, isLoading, error } = useCobrancas(filters);

// ✅ CORRETO: Cache-first para dados estáticos
const { franqueados } = useLocalData();

// ❌ ERRADO: Chamada direta ao Supabase em componentes
const { data } = await supabase.from('cobrancas').select('*');
```

### 🔧 Form Handling Standards
```typescript
// ✅ CORRETO: React Hook Form + Zod
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...}
});

// ✅ CORRETO: Controller para componentes MUI
<Controller
  name="field"
  control={control}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
    />
  )}
/>
```

### 🗃️ Database Integration Rules
- **Supabase Client**: Use o cliente configurado em `src/api/supabaseClient.ts`
- **RLS Policies**: Todas as tabelas devem ter Row Level Security habilitado
- **Type Safety**: Gere tipos a partir do schema do Supabase
- **Error Handling**: Sempre trate erros de banco com mensagens claras
- **Migrations**: Use o Supabase CLI para alterações de schema

---

## 14. Integração com APIs Externas

### 🏦 External APIs (ASAAS, Z-API, Brevo)
- **Edge Functions**: Todas as chamadas externas devem passar por Edge Functions do Supabase
- **Error Handling**: Fallbacks elegantes quando serviços externos falharem
- **Rate Limiting**: Respeite limites de API
- **Secrets Management**: Chaves de API sempre em secrets do Supabase

### 📱 WhatsApp Integration (Z-API)
```typescript
// ✅ CORRETO: Via Edge Function
await sendWhatsAppText({
  phone: '5511999999999',
  message: 'Sua mensagem aqui'
});
```

### 📧 Email Integration (Brevo)
```typescript
// ✅ CORRETO: Via Edge Function
await sendEmail({
  to: 'cliente@email.com',
  subject: 'Assunto',
  html: '<h1>Conteúdo</h1>'
});
```

---

## 15. Regras de Negócio e Lógica

### 💰 Financial Calculations
- **Centralize a lógica** em `configuracoesService`
- **Parâmetros configuráveis**: Juros, multa, descontos sempre vindos do banco
- **Precisão**: Use tratamento correto de decimais
- **Audit Trail**: Log de todas as operações financeiras

### 🤖 AI Integration
- **Provider Agnostic**: Suporte a OpenAI e Anthropic via interface unificada
- **Knowledge Base**: Sistema RAG com pgvector para respostas contextuais
- **Fallback Handling**: Degradação elegante se IA estiver indisponível
- **Rate Limiting**: Implemente throttling para chamadas de IA

---

## 16. Qualidade de Código

### 📝 TypeScript Requirements
- **Strict Mode**: Sempre habilitado
- **No Any Types**: Evite `any`, use tipagem rigorosa
- **Interface Definitions**: Sempre defina interfaces para dados
- **Generic Types**: Use generics para componentes reutilizáveis

### 🧪 Testing Approach
- **Manual Testing**: Teste manual via UI durante o desenvolvimento
- **Error Scenarios**: Teste estados de erro e casos extremos
- **Performance**: Monitore tempos de loading e otimize o cache
- **Cross-Browser**: Compatibilidade com navegadores modernos

### 📚 Documentation Standards
- **Code Comments**: Comente lógicas complexas
- **README Updates**: Documentação sempre atualizada
- **API Documentation**: Documente todos os métodos de serviço
- **Migration Notes**: Documente alterações de schema

---

## 17. Performance Guidelines

### ⚡ Optimization Rules
- **Cache-First**: Use cache local para dados frequentes
- **Lazy Loading**: Carregue componentes/dados sob demanda
- **Debouncing**: Debounce mínimo de 500ms em buscas
- **Pagination**: Paginação server-side para grandes volumes
- **Image Optimization**: Comprima e redimensione imagens antes do upload

### 🔄 Sync Strategy
- **Background Sync**: Sincronização automática a cada 30 minutos
- **Manual Refresh**: Refresh manual com feedback visual
- **Conflict Resolution**: Resolva conflitos de dados de forma elegante
- **Offline Support**: Cache para visualização offline

---

## 18. Segurança

### 🔐 Authentication & Authorization
- **RLS Enforcement**: Toda tabela deve ter políticas de RLS
- **Role-Based Access**: Permissões granulares por tipo de usuário
- **Session Management**: Sessão segura com logout automático
- **Password Security**: Senhas fortes e fluxo de senha temporária

### 🔒 Data Protection
- **Input Validation**: Valide todos os inputs no client e server
- **SQL Injection Prevention**: Use queries parametrizadas
- **XSS Protection**: Sanitize todo conteúdo gerado pelo usuário
- **CORS Configuration**: CORS correto nas Edge Functions

---

**Last Updated**: Janeiro 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team