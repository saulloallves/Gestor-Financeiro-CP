# Sistema Cache-First - Gestor Financeiro CP

## 📋 Visão Geral

O sistema cache-first implementado permite que a aplicação funcione de forma extremamente rápida, carregando dados uma vez no login e mantendo-os sincronizados localmente. Isso elimina a necessidade de múltiplas chamadas à API durante a navegação.

## 🏗️ Arquitetura

### Componentes Principais

1. **Data Store (`src/store/dataStore.ts`)**
   - Store global Zustand com middleware immer
   - Gerencia estados de franqueados, cobranças e usuários internos
   - Calcula estatísticas automaticamente
   - Fornece métodos de consulta local instantâneos

2. **Sync Service (`src/services/syncService.ts`)**
   - Coordena downloads de dados das APIs
   - Implementa progress tracking
   - Trata erros e retry logic
   - Suporta sync incremental

3. **Data Sync Hook (`src/hooks/useDataSync.ts`)**
   - Interface React para o sistema de sync
   - Auto-carregamento no mount
   - Controle de refresh manual e automático
   - Estados de loading, error e progress

4. **Loading Components (`src/components/loading/`)**
   - `DataSyncModal`: Modal de progresso durante sync
   - `PageSkeleton`: Skeleton loader para páginas
   - `TableSkeleton`: Skeleton para tabelas
   - `RefreshButton`: Botão de refresh com estado
   - `SyncStatusChip`: Chip de status de sincronização

## 🚀 Como Usar

### 1. Hook Principal

```typescript
import { useDataSync, useLocalData } from '../hooks/useDataSync';

function MinhaPage() {
  // Controle de sincronização
  const { 
    isLoading, 
    hasInitialLoad, 
    error, 
    progress,
    refreshData 
  } = useDataSync();
  
  // Dados locais (instantâneos)
  const { 
    franqueados, 
    cobrancas, 
    usuariosInternos,
    estatisticas 
  } = useLocalData();

  // Consultas instantâneas (sem loading)
  const cobrancasVencidas = cobrancas.filter(c => c.status === 'vencido');
  const totalEmAberto = estatisticas.valorTotalEmAberto;

  return (
    // Seu JSX aqui
  );
}
```

### 2. Componentes de Loading

```typescript
import { DataSyncModal, PageSkeleton, RefreshButton } from '../components/loading';

// Modal durante sincronização
<DataSyncModal open={isLoading && progress !== null} />

// Skeleton enquanto carrega
{!hasInitialLoad && <PageSkeleton title="Carregando..." />}

// Botão de refresh
<RefreshButton variant="button" force />
```

### 3. Consultas Locais Instantâneas

```typescript
// Filtros instantâneos (sem API calls)
const cobrancasFiltradas = cobrancas.filter(c => {
  return c.status === 'em_aberto' && 
         c.codigo_unidade === 1116;
});

// Estatísticas calculadas automaticamente
const stats = estatisticas; // Sempre atualizado
```

## 📊 Vantagens do Sistema

### Performance
- ⚡ **Consultas instantâneas**: Sem loading entre páginas
- 🚀 **Filtros rápidos**: Processamento local em JavaScript
- 💾 **Cache inteligente**: Dados persistem durante a sessão

### Experiência do Usuário
- 🎯 **Interface responsiva**: Sem spinners constantes
- 🔄 **Sync transparente**: Atualização em background
- 📱 **Trabalho offline**: Dados disponíveis localmente

### Desenvolvimento
- 🧹 **Código limpo**: Menos useEffect e useState
- 🔧 **Fácil manutenção**: Lógica centralizada no store
- 🎨 **Componentes reutilizáveis**: Loading states padronizados

## 🛠️ Integração com Sistema Existente

### Fase 1: Infraestrutura ✅ Concluída
- [x] Data Store global com Zustand
- [x] Sync Service para coordenação
- [x] React Hooks para interface
- [x] Componentes de Loading
- [x] Exemplo de página (CobrancasPageCacheFirst)

### Fase 2: Implementação em Produção
- [ ] Integrar com AuthContext para sync no login
- [ ] Substituir React Query existente
- [ ] Migrar páginas para cache-first
- [ ] Implementar sync incremental

### Fase 3: Otimizações
- [ ] Cache persistence (localStorage/IndexedDB)
- [ ] Background sync automático
- [ ] Conflict resolution
- [ ] Offline support

## 📁 Estrutura de Arquivos

```
src/
├── store/
│   └── dataStore.ts              # Store global Zustand
├── services/
│   └── syncService.ts            # Coordenação de sync
├── hooks/
│   └── useDataSync.ts            # React hooks
├── components/
│   └── loading/                  # Componentes de loading
│       ├── DataSyncModal.tsx
│       ├── PageSkeleton.tsx
│       ├── TableSkeleton.tsx
│       ├── RefreshButton.tsx
│       └── SyncStatusChip.tsx
└── pages/
    ├── CobrancasPageCacheFirst.tsx  # Exemplo de implementação
    └── TesteCacheFirstPage.tsx      # Página de teste
```

## 🧪 Testando o Sistema

### Páginas de Teste Disponíveis

1. **`/teste-cache`** - Página de demonstração básica
   - Mostra status do sistema
   - Exibe estatísticas dos dados carregados
   - Botões para forçar sync e refresh

2. **`/cobrancas-cache`** - Exemplo real de implementação
   - Sistema completo de gestão de cobranças
   - Filtros instantâneos
   - DataGrid com dados locais
   - Interface idêntica à versão original

### Como Testar

1. Acesse `/teste-cache` para ver o sistema funcionando
2. Clique em "Forçar Carregamento" para iniciar sync
3. Observe o modal de progresso
4. Veja as estatísticas sendo calculadas automaticamente
5. Teste filtros instantâneos em `/cobrancas-cache`

## 🔧 Configuração

### Variáveis de Ambiente
```env
# URLs das APIs (já configuradas)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SUPABASE_MATRIZ_URL=...
VITE_SUPABASE_MATRIZ_ANON_KEY=...
```

### Dependências
- `zustand` - State management
- `immer` - Immutable updates
- `react-hot-toast` - Notifications

## 🐛 Troubleshooting

### Problemas Comuns

1. **Dados não carregam**
   - Verificar se APIs estão acessíveis
   - Checar autenticação no Supabase
   - Verificar console para erros

2. **Performance lenta**
   - Verificar tamanho dos dados carregados
   - Implementar paginação se necessário
   - Considerar lazy loading para dados grandes

3. **Sincronização falha**
   - Verificar conectividade
   - Checar tokens de autenticação
   - Verificar logs do syncService

### Debug

```typescript
// Acessar store diretamente no console
window.__dataStore = useDataStore.getState();

// Verificar estado atual
console.log(window.__dataStore);

// Forçar reload
window.__dataStore.loadAllData();
```

## 📈 Próximos Passos

1. **Testar o sistema atual**
   - Acesse as páginas de teste
   - Verifique performance
   - Teste cenários de erro

2. **Integração gradual**
   - Migrar uma página por vez
   - Manter compatibilidade com sistema atual
   - Testar em ambiente de desenvolvimento

3. **Otimizações futuras**
   - Implementar cache persistente
   - Adicionar sync em background
   - Melhorar handling de conflitos

---

**Status**: Fase 1 completa ✅ - Sistema pronto para teste e integração
**Próximo**: Testar funcionalidades e começar Fase 2