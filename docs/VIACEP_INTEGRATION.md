# Serviço ViaCEP - Documentação

Este documento descreve como usar o serviço de integração com a API ViaCEP no projeto "Central Financeira Autônoma com IA".

## 📋 Visão Geral

O serviço ViaCEP permite:
- ✅ Buscar endereços por CEP
- ✅ Autocompletar formulários de endereço
- ✅ Validação e formatação de CEP
- ✅ Pesquisa reversa por endereço
- ✅ Integração fácil com React Hook Form

## 🚀 Uso Básico

### 1. Importar o Serviço

```typescript
import { buscarCep, formatarCep, validarCep } from '../api/viaCepService';
```

### 2. Buscar CEP Simples

```typescript
const endereco = await buscarCep('01001000');
if (endereco) {
  console.log(endereco.logradouro); // "Praça da Sé"
  console.log(endereco.cidade);     // "São Paulo"
  console.log(endereco.uf);         // "SP"
}
```

### 3. Usando o Hook em Formulários

```typescript
import { useViaCep } from '../api/viaCepService';

function MeuFormulario() {
  const { loading, consultarCep, formatarCep } = useViaCep();
  
  const buscarEndereco = async (cep: string) => {
    const endereco = await consultarCep(cep);
    // Usar os dados do endereço...
  };
}
```

## 🎯 Hook Especializado para Formulários

Para formulários com React Hook Form, use o hook especializado:

```typescript
import { useEnderecoForm } from '../hooks/useEnderecoForm';

function FormularioEndereco() {
  const { control, setValue } = useForm();
  
  const {
    loading,
    handleCepChange,
    handleBuscarCep
  } = useEnderecoForm({
    setValue,
    cepFieldName: 'cep',
    ruaFieldName: 'rua',
    bairroFieldName: 'bairro',
    cidadeFieldName: 'cidade',
    estadoFieldName: 'estado',
    ufFieldName: 'uf'
  });

  return (
    <Controller
      name="cep"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label="CEP"
          onChange={(e) => handleCepChange(e.target.value, field.onChange)}
          InputProps={{
            endAdornment: loading && <CircularProgress size={20} />
          }}
        />
      )}
    />
  );
}
```

## 🔧 Funcionalidades Avançadas

### Pesquisa Reversa (por endereço)

```typescript
import { buscarCepPorEndereco } from '../api/viaCepService';

const ceps = await buscarCepPorEndereco('SP', 'São Paulo', 'Paulista');
if (ceps && ceps.length > 0) {
  console.log(ceps[0].cep); // Primeiro CEP encontrado
}
```

### Validação de CEP

```typescript
import { validarCep } from '../api/viaCepService';

const cepValido = validarCep('01001-000'); // true
const cepInvalido = validarCep('123');     // false
```

### Formatação de CEP

```typescript
import { formatarCep, limparCep } from '../api/viaCepService';

const cepFormatado = formatarCep('01001000');    // "01001-000"
const cepLimpo = limparCep('01001-000');         // "01001000"
```

## 📝 Exemplo Completo - Campo de CEP com Auto-preenchimento

```typescript
import { Controller } from 'react-hook-form';
import { TextField, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Search } from 'lucide-react';
import { useEnderecoForm } from '../hooks/useEnderecoForm';

function CampoComViaCep({ control, setValue }) {
  const {
    loading,
    handleCepChange,
    handleBuscarCep
  } = useEnderecoForm({
    setValue,
    cepFieldName: 'endereco_cep',
    ruaFieldName: 'endereco_rua',
    bairroFieldName: 'endereco_bairro',
    cidadeFieldName: 'endereco_cidade',
    estadoFieldName: 'endereco_estado',
    ufFieldName: 'endereco_uf'
  });

  return (
    <Controller
      name="endereco_cep"
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          label="CEP"
          placeholder="00000-000"
          helperText="Digite o CEP para buscar automaticamente o endereço"
          fullWidth
          onChange={(e) => handleCepChange(e.target.value, field.onChange)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => {
                    const cep = (field.value || '').replace(/\D/g, '');
                    if (cep.length === 8) {
                      handleBuscarCep(cep);
                    }
                  }}
                  disabled={loading}
                  size="small"
                >
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Search size={20} />
                  )}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      )}
    />
  );
}
```

## 🎨 Interface de Dados

### Resposta da API ViaCEP

```typescript
interface ViaCepResponse {
  cep: string;          // "01001-000"
  logradouro: string;   // "Praça da Sé"
  complemento: string;  // "lado ímpar"
  unidade: string;      // ""
  bairro: string;       // "Sé"
  localidade: string;   // "São Paulo"
  uf: string;           // "SP"
  estado: string;       // "São Paulo"
  regiao: string;       // "Sudeste"
  ibge: string;         // "3550308"
  gia: string;          // "1004"
  ddd: string;          // "11"
  siafi: string;        // "7107"
  erro?: boolean;       // true se CEP não encontrado
}
```

### Dados Padronizados da Aplicação

```typescript
interface EnderecoData {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  cidade: string;        // Equivale à "localidade" do ViaCEP
  uf: string;
  estado: string;
}
```

## ⚡ Performance e Boas Práticas

### 1. **Cache Automático**
O hook `useEnderecoForm` evita buscar o mesmo CEP consecutivamente.

### 2. **Debounce (Recomendado)**
Para evitar muitas requisições, considere usar debounce:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedBuscarCep = useDebouncedCallback(
  (cep: string) => handleBuscarCep(cep),
  500 // 500ms de delay
);
```

### 3. **Tratamento de Erros**
O serviço já trata erros automaticamente com `react-hot-toast`.

### 4. **Validação Prévia**
Sempre valide o CEP antes de fazer a requisição:

```typescript
if (validarCep(cep)) {
  await consultarCep(cep);
}
```

## 🌐 Endpoints da API ViaCEP

- **Busca por CEP**: `https://viacep.com.br/ws/{cep}/json/`
- **Busca por endereço**: `https://viacep.com.br/ws/{uf}/{cidade}/{logradouro}/json/`

## 🚨 Limitações e Considerações

1. **Rate Limiting**: A API ViaCEP pode bloquear uso massivo
2. **CEPs Inexistentes**: Retorna `{ erro: true }` 
3. **Formato Obrigatório**: CEP deve ter exatamente 8 dígitos
4. **Busca por Endereço**: Requer mínimo 3 caracteres para cidade e logradouro

## 📱 Próximos Passos

Este serviço pode ser facilmente expandido para:
- ✅ Outros formulários da aplicação (cadastro de franqueados, etc.)
- ✅ Validação de endereços em tempo real
- ✅ Integração com mapas (Google Maps, OpenStreetMap)
- ✅ Cache offline com localStorage/IndexedDB
- ✅ Integração com outros serviços de CEP como backup

---

**🔗 Links Úteis:**
- [Documentação oficial ViaCEP](https://viacep.com.br/)
- [Código do serviço](../src/api/viaCepService.ts)
- [Hook para formulários](../src/hooks/useEnderecoForm.ts)
- [Exemplo de uso](../src/components/UnidadeForm.tsx)
