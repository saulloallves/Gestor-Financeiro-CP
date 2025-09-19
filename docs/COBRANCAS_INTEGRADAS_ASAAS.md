# 🏦 Cobranças Integradas com ASAAS

## 📋 Resumo da Implementação

Este documento descreve a implementação completa do sistema de **Cobranças Integradas com ASAAS**, que permite criar cobranças tanto no sistema interno quanto diretamente no gateway ASAAS para geração automática de boletos, PIX e links de pagamento.

## 🚀 Funcionalidades Implementadas

### ✅ **Fase 1: Estrutura de Dados**
- **Novos Tipos TypeScript**: `TipoCliente`, `ClienteSelecionado`, `CobrancaFormData`
- **Validação Zod**: Schemas condicionais para integração ASAAS
- **Suporte a CPF/CNPJ**: Validação automática baseada no tipo de cliente

### ✅ **Fase 2: Serviços Backend**
- **Hooks de Seleção**: `useFranqueadosParaSelecao()`, `useUnidadesParaSelecao()`
- **ASAAS Customer API**: Busca e criação automática de customers
- **Serviço Integrado**: `criarCobrancaIntegrada()` com fallback

### ✅ **Fase 3: Interface do Usuário**
- **Toggle ASAAS**: Checkbox para ativar integração
- **Seleção de Cliente**: Radio buttons (CPF/CNPJ) + Autocomplete
- **Preview do Cliente**: Chip com dados formatados
- **UX Aprimorada**: Seções organizadas e feedback visual

## 🔧 Como Usar

### 1. **Criação de Cobrança Tradicional**
```tsx
// Funciona como antes - apenas preencher dados básicos
- Código da Unidade
- Tipo de Cobrança  
- Valor
- Data de Vencimento
- Observações
```

### 2. **Criação de Cobrança Integrada ASAAS**
```tsx
// Novo fluxo com integração
1. ✅ Marcar "Criar cobrança no ASAAS"
2. 📋 Selecionar tipo: CPF (Franqueado) ou CNPJ (Unidade)
3. 🔍 Buscar e selecionar cliente no autocomplete
4. 👀 Verificar preview do cliente selecionado
5. 💾 Submeter - criação dupla (interno + ASAAS)
```

## 📊 Arquivos Modificados

### **Core Types**
- `src/types/cobrancas.ts` - Interfaces principais
- `src/utils/cobrancaSchemas.ts` - Validações Zod

### **Backend Services**
- `src/hooks/useClienteSelecao.ts` - Hooks de seleção
- `src/api/asaasService.ts` - Customer management
- `src/api/cobrancasService.ts` - Criação integrada

### **Frontend Components**
- `src/components/CobrancaForm.tsx` - Interface completa

## 🎯 Benefícios

### **Para Usuários**
- ✅ **Interface Única**: Uma tela para criação dupla
- 🔄 **Sincronização Automática**: Customer ASAAS criado automaticamente
- 🎨 **UX Intuitiva**: Seleção visual com preview
- ⚡ **Performance**: Cache e loading states

### **Para Desenvolvedores**
- 🏗️ **Arquitetura Sólida**: Separação clara de responsabilidades
- 🔒 **Type Safety**: TypeScript em todas as camadas
- 🧪 **Testável**: Hooks e serviços isolados
- 📖 **Manutenível**: Código bem documentado

## 🛡️ Validações e Segurança

### **Validações Frontend**
```typescript
// CPF: apenas para franqueados
// CNPJ: apenas para unidades  
// Cliente obrigatório se ASAAS ativado
// Fallback para criação tradicional
```

### **Tratamento de Erros**
- ❌ **ASAAS offline**: Cria apenas internamente
- 🔄 **Customer existe**: Reutiliza existing
- 📝 **Dados inválidos**: Feedback visual claro

## 🚀 Próximos Passos

### **Melhorias Futuras**
1. **Webhooks ASAAS**: Sincronização de status
2. **Histórico de Pagamentos**: Timeline integrada
3. **Notificações**: Email/WhatsApp automático
4. **Relatórios**: Dashboard de performance ASAAS

---

**Implementado em**: Janeiro 2025  
**Status**: ✅ Produção  
**Versão**: 1.0.0