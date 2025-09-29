import { z } from 'zod';
import { startOfDay } from 'date-fns';
import { validarCpf, validarCnpj } from './validations';

// Schema base para cobrança
const cobrancaBaseSchema = z.object({
  codigo_unidade: z.number().int().min(1000, 'Código deve ter 4 dígitos').max(9999, 'Código deve ter 4 dígitos'),
  tipo_cobranca: z.enum(['royalties', 'insumos', 'aluguel', 'eventual', 'taxa_franquia']),
  valor_original: z.number().positive('Valor deve ser maior que zero'),
  vencimento: z.date(),
  observacoes: z.string().optional(),
});

// Schema estendido para criação de cobrança com integração ASAAS
export const cobrancaFormSchema = cobrancaBaseSchema.extend({
  // Campos específicos para integração ASAAS
  criar_no_asaas: z.boolean().default(false),
  tipo_cliente: z.enum(['cpf', 'cnpj']).optional(),
  franqueado_id: z.string().optional(),
  unidade_id: z.number().optional(),
  cliente_selecionado: z.object({
    id: z.union([z.string(), z.number()]),
    nome: z.string(),
    documento: z.string(),
    email: z.string().optional(),
    telefone: z.string().optional(),
    tipo: z.enum(['cpf', 'cnpj']),
  }).optional(),
  // Sobrescreve a validação de vencimento para criação
  vencimento: z.date().refine((date) => {
    return startOfDay(date) >= startOfDay(new Date());
  }, {
    message: "Não é possível criar cobranças vencidas.",
  }),
}).superRefine((data, ctx) => {
  // Só aplicar validações ASAAS se criar_no_asaas for true
  if (data.criar_no_asaas) {
    if (!data.tipo_cliente) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quando 'Criar no ASAAS' estiver marcado, é obrigatório selecionar o tipo de cliente.",
        path: ['tipo_cliente'],
      });
    }
    
    if (!data.cliente_selecionado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quando 'Criar no ASAAS' estiver marcado, é obrigatório selecionar um cliente.",
        path: ['cliente_selecionado'],
      });
    }
    
    // Se tipo_cliente for CPF, deve ter franqueado_id
    if (data.tipo_cliente === 'cpf' && !data.franqueado_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Para tipo CPF, é obrigatório selecionar um franqueado.",
        path: ['franqueado_id'],
      });
    }
    
    // Se tipo_cliente for CNPJ, deve ter unidade_id
    if (data.tipo_cliente === 'cnpj' && !data.unidade_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Para tipo CNPJ, é obrigatório selecionar uma unidade.",
        path: ['unidade_id'],
      });
    }
    
    // Validar documento do cliente selecionado
    if (data.cliente_selecionado) {
      const { documento, tipo } = data.cliente_selecionado;
      let documentoValido = false;
      
      if (tipo === 'cpf') {
        documentoValido = validarCpf(documento);
      } else if (tipo === 'cnpj') {
        documentoValido = validarCnpj(documento);
      }
      
      if (!documentoValido) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Documento do cliente selecionado é inválido.",
          path: ['cliente_selecionado', 'documento'],
        });
      }
    }
  }
});

// Tipos inferidos do schema
export type CobrancaFormData = z.infer<typeof cobrancaFormSchema>;

// Schema para edição (campos básicos, sem validações ASAAS e sem restrição de data)
export const editarCobrancaFormSchema = cobrancaBaseSchema.extend({
  criar_no_asaas: z.boolean().default(false).optional(),
  tipo_cliente: z.enum(['cpf', 'cnpj']).optional(),
  franqueado_id: z.string().optional(),
  unidade_id: z.number().optional(),
  cliente_selecionado: z.object({
    id: z.union([z.string(), z.number()]),
    nome: z.string(),
    documento: z.string(),
    email: z.string().optional(),
    telefone: z.string().optional(),
    tipo: z.enum(['cpf', 'cnpj']),
  }).optional(),
});

export type EditarCobrancaFormData = z.infer<typeof editarCobrancaFormSchema>;

// Schema para edição da API (sem campos ASAAS)
export const editarCobrancaSchema = cobrancaBaseSchema.partial().extend({
  id: z.string(),
});

export type EditarCobrancaData = z.infer<typeof editarCobrancaSchema>;

// Schema para validação de cliente
export const clienteSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nome: z.string().min(1, 'Nome é obrigatório'),
  documento: z.string().min(1, 'Documento é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  tipo: z.enum(['cpf', 'cnpj']),
}).refine((data) => {
  // Validar documento baseado no tipo
  if (data.tipo === 'cpf') {
    return validarCpf(data.documento);
  } else if (data.tipo === 'cnpj') {
    return validarCnpj(data.documento);
  }
  return false;
}, {
  message: "Documento inválido para o tipo selecionado.",
  path: ['documento'],
});

export type ClienteData = z.infer<typeof clienteSchema>;