# Validação de Documentos Brasileiros

Este documento descreve as funções de validação de documentos brasileiros implementadas no projeto.

## 📋 Visão Geral

O sistema inclui validação completa para:
- ✅ **CNPJ** (Cadastro Nacional da Pessoa Jurídica)
- ✅ **CPF** (Cadastro de Pessoas Físicas)
- ✅ **Telefones** brasileiros (fixos e celulares)
- ✅ **CEP** (Código de Endereçamento Postal)

## 🎯 Funcionalidades

### 1. **Validação de CNPJ**

```typescript
import { validarCnpj, formatarCnpj } from '../utils/validations';

// Validar CNPJ
const cnpjValido = validarCnpj('11.222.333/0001-81'); // true ou false

// Formatar CNPJ
const cnpjFormatado = formatarCnpj('11222333000181'); // "11.222.333/0001-81"
```

**Características:**
- ✅ Aceita CNPJ com ou sem formatação
- ✅ Calcula e valida dígitos verificadores
- ✅ Rejeita CNPJs com todos os dígitos iguais
- ✅ Formata automaticamente para o padrão brasileiro

### 2. **Validação de CPF**

```typescript
import { validarCpf, formatarCpf } from '../utils/validations';

// Validar CPF
const cpfValido = validarCpf('123.456.789-09'); // true ou false

// Formatar CPF
const cpfFormatado = formatarCpf('12345678909'); // "123.456.789-09"
```

**Características:**
- ✅ Aceita CPF com ou sem formatação
- ✅ Calcula e valida dígitos verificadores
- ✅ Rejeita CPFs com todos os dígitos iguais
- ✅ Formata automaticamente para o padrão brasileiro

### 3. **Validação de Telefone**

```typescript
import { validarTelefone, formatarTelefone } from '../utils/validations';

// Validar telefone
const telefoneValido = validarTelefone('11999887766'); // true ou false

// Formatar telefone
const telefoneFormatado = formatarTelefone('11999887766'); // "(11) 99988-7766"
```

**Características:**
- ✅ Suporte para telefones fixos (10 dígitos) e celulares (11 dígitos)
- ✅ Validação de DDD (11-99)
- ✅ Para celulares, valida se o terceiro dígito é 9
- ✅ Formatação automática com parênteses e hífen

### 4. **Funções Utilitárias**

```typescript
import { limparNumeros } from '../utils/validations';

// Remove todos os caracteres não numéricos
const apenasNumeros = limparNumeros('(11) 99988-7766'); // "11999887766"
```

## 🔧 Integração com Formulários

### Uso com React Hook Form + Zod

```typescript
import { z } from 'zod';
import { validarCnpj, validarCpf, validarTelefone } from '../utils/validations';

const schema = z.object({
  cnpj: z.string()
    .optional()
    .refine((cnpj) => {
      if (!cnpj || cnpj.trim() === '') return true;
      return validarCnpj(cnpj);
    }, {
      message: 'CNPJ inválido'
    }),
    
  cpf: z.string()
    .optional()
    .refine((cpf) => {
      if (!cpf || cpf.trim() === '') return true;
      return validarCpf(cpf);
    }, {
      message: 'CPF inválido'
    }),
    
  telefone: z.string()
    .optional()
    .refine((telefone) => {
      if (!telefone || telefone.trim() === '') return true;
      return validarTelefone(telefone);
    }, {
      message: 'Telefone inválido'
    })
});
```

### Campo com Formatação Automática

```typescript
import { Controller } from 'react-hook-form';
import { TextField } from '@mui/material';
import { formatarCnpj } from '../utils/validations';

<Controller
  name="cnpj"
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      label="CNPJ"
      placeholder="00.000.000/0000-00"
      onChange={(e) => {
        const valor = e.target.value;
        const cnpjFormatado = formatarCnpj(valor);
        field.onChange(cnpjFormatado);
      }}
    />
  )}
/>
```

## 📱 Exemplos Práticos

### 1. **Campo CNPJ Completo**

```typescript
function CampoCnpj({ control, errors }: Props) {
  return (
    <Controller
      name="cnpj"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label="CNPJ"
          placeholder="00.000.000/0000-00"
          error={!!errors.cnpj}
          helperText={errors.cnpj?.message || 'Formato: 00.000.000/0000-00'}
          fullWidth
          onChange={(e) => {
            const valor = e.target.value;
            const cnpjFormatado = formatarCnpj(valor);
            field.onChange(cnpjFormatado);
          }}
        />
      )}
    />
  );
}
```

### 2. **Validação Manual**

```typescript
function validarDocumento(tipo: 'cpf' | 'cnpj', documento: string): boolean {
  if (tipo === 'cpf') {
    return validarCpf(documento);
  } else {
    return validarCnpj(documento);
  }
}

// Uso
const documentoValido = validarDocumento('cnpj', '11.222.333/0001-81');
if (!documentoValido) {
  toast.error('Documento inválido!');
}
```

## 🎨 Regex Patterns Disponíveis

```typescript
import { REGEX_PATTERNS } from '../utils/validations';

// Verificar se o formato está correto (não valida dígitos verificadores)
const formatoCnpjOk = REGEX_PATTERNS.CNPJ.test('11.222.333/0001-81'); // true
const formatoCpfOk = REGEX_PATTERNS.CPF.test('123.456.789-09'); // true
const formatoCepOk = REGEX_PATTERNS.CEP.test('01001-000'); // true
const formatoTelefoneOk = REGEX_PATTERNS.TELEFONE.test('(11) 99999-9999'); // true
```

**Patterns disponíveis:**
- `REGEX_PATTERNS.CNPJ` - Formato de CNPJ
- `REGEX_PATTERNS.CPF` - Formato de CPF
- `REGEX_PATTERNS.CEP` - Formato de CEP
- `REGEX_PATTERNS.TELEFONE` - Formato de telefone
- `REGEX_PATTERNS.EMAIL` - Email básico
- `REGEX_PATTERNS.APENAS_NUMEROS` - Apenas dígitos
- `REGEX_PATTERNS.APENAS_LETRAS` - Apenas letras (com acentos)

## ⚡ Performance e Algoritmos

### **Algoritmo de Validação CNPJ:**
1. Remove caracteres não numéricos
2. Verifica se tem exatamente 14 dígitos
3. Rejeita se todos os dígitos são iguais
4. Calcula primeiro dígito verificador usando pesos 5,4,3,2,9,8,7,6,5,4,3,2
5. Calcula segundo dígito verificador usando pesos 6,5,4,3,2,9,8,7,6,5,4,3,2
6. Compara com os dígitos fornecidos

### **Algoritmo de Validação CPF:**
1. Remove caracteres não numéricos
2. Verifica se tem exatamente 11 dígitos
3. Rejeita se todos os dígitos são iguais
4. Calcula primeiro dígito verificador usando pesos 10,9,8,7,6,5,4,3,2
5. Calcula segundo dígito verificador usando pesos 11,10,9,8,7,6,5,4,3,2
6. Compara com os dígitos fornecidos

## 🚨 Casos Especiais

### **CNPJs Inválidos Conhecidos:**
```typescript
// Todos rejeitados automaticamente
validarCnpj('11.111.111/1111-11'); // false
validarCnpj('22.222.222/2222-22'); // false
validarCnpj('00.000.000/0000-00'); // false
```

### **CPFs Inválidos Conhecidos:**
```typescript
// Todos rejeitados automaticamente
validarCpf('111.111.111-11'); // false
validarCpf('222.222.222-22'); // false
validarCpf('000.000.000-00'); // false
```

### **Telefones Válidos:**
```typescript
validarTelefone('(11) 99999-9999'); // true - celular SP
validarTelefone('(11) 3333-4444'); // true - fixo SP
validarTelefone('11999998888'); // true - sem formatação
```

### **Telefones Inválidos:**
```typescript
validarTelefone('(00) 99999-9999'); // false - DDD inválido
validarTelefone('(11) 89999-9999'); // false - celular sem 9
validarTelefone('119999'); // false - poucos dígitos
```

## 🔧 Extensibilidade

### Adicionando Novos Tipos de Documento:

```typescript
// Exemplo: Validação de Inscrição Estadual (IE)
export function validarInscricaoEstadual(ie: string, uf: string): boolean {
  // Implementar algoritmo específico por UF
  // Cada estado tem seu próprio algoritmo
  return true; // Implementação específica
}

// Exemplo: RG
export function formatarRg(rg: string): string {
  const rgLimpo = limparNumeros(rg);
  if (rgLimpo.length === 9) {
    return rgLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, '$1.$2.$3-$4');
  }
  return rg;
}
```

## 📚 Referências

- **CNPJ**: [Receita Federal - Validação CNPJ](http://www.receita.fazenda.gov.br/)
- **CPF**: [Receita Federal - Validação CPF](http://www.receita.fazenda.gov.br/)
- **DDD**: [ANATEL - Códigos de Área](https://www.anatel.gov.br/)
- **CEP**: [Correios - Busca CEP](https://buscacepinter.correios.com.br/)

---

**🔗 Arquivos relacionados:**
- [Implementação das validações](../src/utils/validations.ts)
- [Uso no formulário de unidades](../src/components/UnidadeForm.tsx)
- [Integração ViaCEP](./VIACEP_INTEGRATION.md)
