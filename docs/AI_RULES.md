# AI Development Rules - Gestor Financeiro CP

## 📋 Tech Stack Overview

- **Frontend Framework**: React 19 + TypeScript + Vite for fast development and type safety
- **UI Library**: Material-UI (MUI) v7 exclusively - NO other UI libraries (shadcn/ui, Ant Design, etc.)
- **State Management**: Zustand for global state + React Query (TanStack Query) for server state
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS) and Edge Functions
- **Forms**: React Hook Form + Zod for validation and type-safe form handling
- **Routing**: React Router DOM v7 with protected routes and role-based access
- **Styling**: Material-UI theme system + custom theme (`src/styles/theme.ts`) - NO Tailwind CSS
- **Icons**: Lucide React exclusively for consistent iconography
- **Date Handling**: date-fns with Portuguese locale for all date operations
- **Notifications**: react-hot-toast for user feedback and error handling

## 🎯 Architecture Patterns

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
- **Auth Provider**: Supabase Auth with custom AuthService wrapper
- **Session Management**: Zustand store with persistence
- **Route Protection**: ProtectedRoute component with role-based access
- **User Types**: `interno` (internal staff) vs `franqueado` (franchisee) access levels

### 🗄️ Data Management Strategy
- **Cache-First Architecture**: Zustand store with local data cache for performance
- **Sync Service**: Background synchronization with external databases
- **React Query**: For real-time data that needs frequent updates (cobranças)
- **Local Storage**: Persist auth state and cache data between sessions

## 🚫 What NOT to Use

### ❌ Forbidden Libraries/Patterns
- **NO Tailwind CSS** - Use Material-UI theme system exclusively
- **NO shadcn/ui** - All components must be Material-UI based
- **NO Ant Design, Chakra UI, or other UI libraries**
- **NO CSS-in-JS libraries** other than Material-UI's emotion
- **NO Redux/RTK** - Use Zustand for global state
- **NO Axios** - Use Supabase client or native fetch
- **NO moment.js** - Use date-fns exclusively

### ❌ Anti-Patterns to Avoid
- **NO inline styles** - Use Material-UI's sx prop or theme
- **NO hardcoded colors** - Use theme.palette values
- **NO direct database queries in components** - Use service layer
- **NO untyped API responses** - Always define TypeScript interfaces
- **NO mixed state management** - Choose between Zustand or React Query per use case

## ✅ Required Patterns

### 🎨 UI/UX Standards
- **Material-UI Components**: Use MUI components exclusively
- **Theme Consistency**: All colors via `theme.palette`, spacing via `theme.spacing()`
- **Typography**: Poppins font family as defined in theme
- **Responsive Design**: Use MUI breakpoints and responsive props
- **Loading States**: Consistent loading indicators and skeleton screens
- **Error Handling**: Toast notifications for user feedback

### 📊 Data Fetching Patterns
```typescript
// ✅ CORRECT: Service layer with React Query
const { data, isLoading, error } = useCobrancas(filters);

// ✅ CORRECT: Cache-first for static data
const { franqueados } = useLocalData();

// ❌ WRONG: Direct Supabase calls in components
const { data } = await supabase.from('cobrancas').select('*');
```

### 🔧 Form Handling Standards
```typescript
// ✅ CORRECT: React Hook Form + Zod
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...}
});

// ✅ CORRECT: Controller for MUI components
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
- **Supabase Client**: Use configured client from `src/api/supabaseClient.ts`
- **RLS Policies**: All tables must have Row Level Security enabled
- **Type Safety**: Generate types from Supabase schema
- **Error Handling**: Wrap all database calls in try-catch with meaningful errors
- **Migrations**: Use Supabase CLI for schema changes

## 🔄 Integration Guidelines

### 🏦 External APIs (ASAAS, Z-API, Brevo)
- **Edge Functions**: All external API calls through Supabase Edge Functions
- **Error Handling**: Graceful fallbacks when external services fail
- **Rate Limiting**: Respect API limits with proper delays
- **Secrets Management**: Store API keys in Supabase secrets, never in code

### 📱 WhatsApp Integration (Z-API)
```typescript
// ✅ CORRECT: Through Edge Function
await sendWhatsAppText({
  phone: '5511999999999',
  message: 'Sua mensagem aqui'
});
```

### 📧 Email Integration (Brevo)
```typescript
// ✅ CORRECT: Through Edge Function
await sendEmail({
  to: 'cliente@email.com',
  subject: 'Assunto',
  html: '<h1>Conteúdo</h1>'
});
```

## 🎯 Business Logic Rules

### 💰 Financial Calculations
- **Centralized Logic**: All calculations in `configuracoesService`
- **Configurable Parameters**: Juros, multa, and discount rates from database
- **Precision**: Use proper decimal handling for currency calculations
- **Audit Trail**: Log all financial operations for compliance

### 🤖 AI Integration
- **Provider Agnostic**: Support OpenAI and Anthropic through unified interface
- **Knowledge Base**: RAG system with pgvector for contextual responses
- **Fallback Handling**: Graceful degradation when AI services are unavailable
- **Rate Limiting**: Implement proper throttling for AI API calls

## 🔍 Code Quality Standards

### 📝 TypeScript Requirements
- **Strict Mode**: Enable strict TypeScript checking
- **No Any Types**: Avoid `any`, use proper typing
- **Interface Definitions**: Define interfaces for all data structures
- **Generic Types**: Use generics for reusable components

### 🧪 Testing Approach
- **Manual Testing**: Thorough testing through UI during development
- **Error Scenarios**: Test error states and edge cases
- **Performance**: Monitor loading times and optimize cache usage
- **Cross-Browser**: Ensure compatibility with modern browsers

### 📚 Documentation Standards
- **Code Comments**: Document complex business logic
- **README Updates**: Keep documentation current with features
- **API Documentation**: Document all service methods
- **Migration Notes**: Document database schema changes

## 🚀 Performance Guidelines

### ⚡ Optimization Rules
- **Cache-First**: Use local cache for frequently accessed data
- **Lazy Loading**: Load components and data on demand
- **Debouncing**: Implement search debouncing (500ms minimum)
- **Pagination**: Use server-side pagination for large datasets
- **Image Optimization**: Compress and resize images before upload

### 🔄 Sync Strategy
- **Background Sync**: Automatic data synchronization every 30 minutes
- **Manual Refresh**: User-triggered refresh with visual feedback
- **Conflict Resolution**: Handle data conflicts gracefully
- **Offline Support**: Cache data for offline viewing

## 🛡️ Security Requirements

### 🔐 Authentication & Authorization
- **RLS Enforcement**: Every table must have proper RLS policies
- **Role-Based Access**: Implement granular permissions per user type
- **Session Management**: Secure session handling with automatic logout
- **Password Security**: Enforce strong passwords and temporary password flows

### 🔒 Data Protection
- **Input Validation**: Validate all user inputs on both client and server
- **SQL Injection Prevention**: Use parameterized queries exclusively
- **XSS Protection**: Sanitize all user-generated content
- **CORS Configuration**: Proper CORS setup for Edge Functions

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: Development Team