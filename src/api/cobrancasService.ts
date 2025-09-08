import { supabase } from './supabaseClient';
import { asaasService } from './asaasService';
import { configuracoesService } from './configuracoesService';
import type { 
  Cobranca, 
  CriarCobrancaData, 
  EditarCobrancaData, 
  CobrancasFilters,
  NegociacaoCobranca 
} from '../types/cobrancas';

class CobrancasService {
  async listarCobrancas(filters?: CobrancasFilters): Promise<Cobranca[]> {
    let query = supabase
      .from('cobrancas')
      .select(`
        *,
        unidade:unidades(id, codigo_unidade, nome_padrao)
      `)
      .order('created_at', { ascending: false });

    if (filters?.unidade_id) {
      query = query.eq('unidade_id', filters.unidade_id);
    }

    if (filters?.tipo_cobranca) {
      query = query.eq('tipo_cobranca', filters.tipo_cobranca);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.data_vencimento_inicio) {
      query = query.gte('vencimento', filters.data_vencimento_inicio);
    }

    if (filters?.data_vencimento_fim) {
      query = query.lte('vencimento', filters.data_vencimento_fim);
    }

    if (filters?.valor_minimo) {
      query = query.gte('valor_atualizado', filters.valor_minimo);
    }

    if (filters?.valor_maximo) {
      query = query.lte('valor_atualizado', filters.valor_maximo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async obterCobranca(id: string): Promise<Cobranca | null> {
    const { data, error } = await supabase
      .from('cobrancas')
      .select(`
        *,
        unidade:unidades(id, codigo_unidade, nome_padrao)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }

  async criarCobranca(dados: CriarCobrancaData): Promise<Cobranca> {
    const cobrancaData = {
      ...dados,
      valor_atualizado: dados.valor_original,
      status: 'pendente' as const,
      juros_aplicado: 0,
      multa_aplicada: 0,
      dias_atraso: 0,
    };

    // Criar cobrança no banco local primeiro
    const { data: cobranca, error } = await supabase
      .from('cobrancas')
      .insert(cobrancaData)
      .select(`
        *,
        unidade:unidades(id, codigo_unidade, nome_padrao, franqueado:franqueados(id, nome, email, telefone, cpf))
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    try {
      // Integração com ASAAS - Garantir que o cliente existe
      let asaasCustomerId: string | null = null;

      if (cobranca.unidade?.franqueado) {
        asaasCustomerId = await this.garantirClienteAsaas(
          cobranca.unidade.franqueado, 
          cobranca.unidade_id
        );
      }

      if (asaasCustomerId) {
        // Criar cobrança no ASAAS
        const paymentData = {
          customer: asaasCustomerId,
          billingType: 'BOLETO' as const,
          value: cobranca.valor_original,
          dueDate: cobranca.vencimento,
          description: cobranca.descricao,
          externalReference: cobranca.id,
          fine: {
            value: await this.getMultaPercentual(),
            type: 'PERCENTAGE' as const,
          },
          interest: {
            value: await this.getJurosPercentual(),
            type: 'PERCENTAGE' as const,
          },
        };

        const asaasPayment = await asaasService.createPayment(paymentData);

        // Salvar ID do pagamento ASAAS na cobrança
        await supabase
          .from('cobrancas')
          .update({ 
            asaas_payment_id: asaasPayment.id,
            boleto_url: asaasPayment.bankSlipUrl,
            link_pagamento: asaasPayment.invoiceUrl,
          })
          .eq('id', cobranca.id);

        // Atualizar objeto retornado
        cobranca.asaas_payment_id = asaasPayment.id;
        cobranca.boleto_url = asaasPayment.bankSlipUrl;
        cobranca.link_pagamento = asaasPayment.invoiceUrl;
      }
    } catch (asaasError) {
      console.error('Erro na integração ASAAS:', asaasError);
      // Não falha a criação da cobrança se houver erro no ASAAS
      // Apenas loga o erro para análise posterior
    }

    return cobranca;
  }

  private async getMultaPercentual(): Promise<number> {
    try {
      const config = await configuracoesService.obterConfiguracao();
      return config.valor_multa_atraso || 2;
    } catch {
      return 2; // Default 2%
    }
  }

  private async getJurosPercentual(): Promise<number> {
    try {
      const config = await configuracoesService.obterConfiguracao();
      return config.taxa_juros_diaria || 0.033;
    } catch {
      return 0.033; // Default 0.033% ao dia
    }
  }

  /**
   * Garante que o franqueado tem um cliente correspondente no ASAAS
   * @param franqueado Dados do franqueado
   * @param unidadeId ID da unidade para usar como referência externa
   * @returns ID do cliente no ASAAS
   */
  private async garantirClienteAsaas(franqueado: { 
    id: string; 
    nome: string; 
    email?: string; 
    telefone?: string; 
    cpf: string; 
    asaas_customer_id?: string; 
  }, unidadeId: string): Promise<string | null> {
    try {
      // Se já tem ID salvo, retorna direto
      if (franqueado.asaas_customer_id) {
        return franqueado.asaas_customer_id;
      }

      // Buscar cliente existente no ASAAS por CPF
      const existingCustomers = await asaasService.getCustomers({
        cpfCnpj: franqueado.cpf,
        limit: 1
      });

      let asaasCustomerId: string;

      if (existingCustomers.data && existingCustomers.data.length > 0 && existingCustomers.data[0].id) {
        // Cliente já existe no ASAAS, usar o ID existente
        asaasCustomerId = existingCustomers.data[0].id;
      } else {
        // Cliente não existe, criar novo cliente no ASAAS
        const customerData = {
          name: franqueado.nome,
          email: franqueado.email || '',
          phone: franqueado.telefone || '',
          cpfCnpj: franqueado.cpf,
          externalReference: unidadeId,
        };

        const asaasCustomer = await asaasService.createCustomer(customerData);
        if (!asaasCustomer.id) {
          throw new Error('ASAAS não retornou ID do cliente criado');
        }
        asaasCustomerId = asaasCustomer.id;
      }

      // Salvar customer_id no franqueado local
      await supabase
        .from('franqueados')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', franqueado.id);

      return asaasCustomerId;
    } catch (error) {
      console.error('Erro ao garantir cliente ASAAS:', error);
      return null;
    }
  }

  async editarCobranca(id: string, dados: EditarCobrancaData): Promise<Cobranca> {
    // Obter cobrança atual para verificar se tem ID ASAAS
    const cobrancaAtual = await this.obterCobranca(id);
    if (!cobrancaAtual) {
      throw new Error('Cobrança não encontrada');
    }

    // Atualizar no banco local
    const { data, error } = await supabase
      .from('cobrancas')
      .update(dados)
      .eq('id', id)
      .select(`
        *,
        unidade:unidades(id, codigo_unidade, nome_padrao)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Se tem ID ASAAS, atualizar no ASAAS também
    if (cobrancaAtual.asaas_payment_id) {
      try {
        const updateData: Partial<{
          value: number;
          dueDate: string;
          description: string;
        }> = {};
        
        if (dados.valor_original) {
          updateData.value = dados.valor_original;
        }
        
        if (dados.vencimento) {
          updateData.dueDate = dados.vencimento;
        }
        
        if (dados.observacoes) {
          updateData.description = dados.observacoes;
        }

        if (Object.keys(updateData).length > 0) {
          await asaasService.updatePayment(cobrancaAtual.asaas_payment_id, updateData);
        }
      } catch (asaasError) {
        console.error('Erro ao atualizar cobrança no ASAAS:', asaasError);
        // Não falha a edição se houver erro no ASAAS
      }
    }

    return data;
  }

  async excluirCobranca(id: string): Promise<void> {
    // Obter cobrança atual para verificar se tem ID ASAAS
    const cobrancaAtual = await this.obterCobranca(id);
    
    // Se tem ID ASAAS, deletar no ASAAS primeiro
    if (cobrancaAtual?.asaas_payment_id) {
      try {
        await asaasService.deletePayment(cobrancaAtual.asaas_payment_id);
      } catch (asaasError) {
        console.error('Erro ao deletar cobrança no ASAAS:', asaasError);
        // Continue com a exclusão local mesmo se houver erro no ASAAS
      }
    }

    // Deletar do banco local
    const { error } = await supabase
      .from('cobrancas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async atualizarStatusCobranca(id: string, status: Cobranca['status']): Promise<Cobranca> {
    const { data, error } = await supabase
      .from('cobrancas')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        unidade:unidades(id, codigo_unidade, nome_padrao)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async gerarBoletoAsaas(id: string): Promise<{ boleto_url: string; link_pagamento: string }> {
    const cobranca = await this.obterCobranca(id);
    if (!cobranca) {
      throw new Error('Cobrança não encontrada');
    }

    if (cobranca.asaas_payment_id) {
      // Já tem boleto ASAAS, apenas obter URLs
      const boletoUrl = await asaasService.getBankSlipUrl(cobranca.asaas_payment_id);
      const linkPagamento = await asaasService.getPaymentUrl(cobranca.asaas_payment_id);
      
      // Atualizar URLs no banco
      await supabase
        .from('cobrancas')
        .update({ 
          boleto_url: boletoUrl,
          link_pagamento: linkPagamento,
        })
        .eq('id', id);

      return { boleto_url: boletoUrl, link_pagamento: linkPagamento };
    }

    throw new Error('Cobrança não possui integração com ASAAS. Recriar a cobrança.');
  }

  async sincronizarStatusAsaas(id: string): Promise<Cobranca> {
    const cobranca = await this.obterCobranca(id);
    if (!cobranca?.asaas_payment_id) {
      throw new Error('Cobrança não possui integração com ASAAS');
    }

    try {
      const asaasPayment = await asaasService.getPayment(cobranca.asaas_payment_id);
      
      // Mapear status ASAAS para nosso sistema
      let novoStatus: Cobranca['status'] = cobranca.status;
      
      switch (asaasPayment.status) {
        case 'PENDING':
          novoStatus = 'pendente';
          break;
        case 'RECEIVED':
        case 'CONFIRMED':
        case 'RECEIVED_IN_CASH':
          novoStatus = 'pago';
          break;
        case 'OVERDUE':
          novoStatus = 'vencido';
          break;
        case 'REFUNDED':
        case 'REFUND_REQUESTED':
        case 'REFUND_IN_PROGRESS':
          novoStatus = 'cancelado';
          break;
      }

      // Atualizar no banco se status mudou
      if (novoStatus !== cobranca.status) {
        return await this.atualizarStatusCobranca(id, novoStatus);
      }

      return cobranca;
    } catch (error) {
      console.error('Erro ao sincronizar status ASAAS:', error);
      throw new Error('Erro ao sincronizar com ASAAS');
    }
  }

  async vincularBoleto(id: string, boletoId: string, linkBoleto: string, asaasPaymentId?: string, asaasCustomerId?: string): Promise<Cobranca> {
    const updateData: {
      boleto_id: string;
      link_boleto: string;
      asaas_payment_id?: string;
      asaas_customer_id?: string;
    } = { 
      boleto_id: boletoId,
      link_boleto: linkBoleto,
    };

    if (asaasPaymentId) {
      updateData.asaas_payment_id = asaasPaymentId;
    }

    if (asaasCustomerId) {
      updateData.asaas_customer_id = asaasCustomerId;
    }

    const { data, error } = await supabase
      .from('cobrancas')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        unidade:unidades(id, codigo_unidade, nome_padrao)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async atualizarValores(): Promise<void> {
    // Obter configurações atuais
    const configuracao = await configuracoesService.obterConfiguracao();
    
    const dataAtual = new Date();
    
    const { data: cobrancasVencidas, error: errorBusca } = await supabase
      .from('cobrancas')
      .select('*')
      .lt('vencimento', dataAtual.toISOString())
      .in('status', ['pendente', 'em_aberto', 'atrasado', 'em_atraso']);

    if (errorBusca) {
      throw new Error(errorBusca.message);
    }

    if (!cobrancasVencidas || cobrancasVencidas.length === 0) {
      return;
    }

    const atualizacoes = cobrancasVencidas.map(cobranca => {
      const resultado = configuracoesService.calcularValoresCobranca({
        valorOriginal: cobranca.valor_original,
        dataVencimento: cobranca.vencimento,
        dataCalculo: dataAtual.toISOString(),
        configuracao
      });
      
      let novoStatus = cobranca.status;
      if (resultado.diasAtraso > 0) {
        if (resultado.diasAtraso <= (configuracao.dias_escalonamento_juridico || 30)) {
          novoStatus = 'em_atraso';
        } else {
          novoStatus = 'juridico';
        }
      }

      return {
        id: cobranca.id,
        valor_atualizado: resultado.valorTotal,
        juros_aplicado: resultado.valorJuros,
        multa_aplicada: resultado.valorMulta,
        dias_atraso: resultado.diasAtraso,
        status: novoStatus,
      };
    });

    for (const atualizacao of atualizacoes) {
      const { error } = await supabase
        .from('cobrancas')
        .update({
          valor_atualizado: atualizacao.valor_atualizado,
          juros_aplicado: atualizacao.juros_aplicado,
          multa_aplicada: atualizacao.multa_aplicada,
          dias_atraso: atualizacao.dias_atraso,
          status: atualizacao.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', atualizacao.id);

      if (error) {
        console.error(`Erro ao atualizar cobrança ${atualizacao.id}:`, error);
      }
    }
  }

  async obterEstatisticas(): Promise<{
    totalCobrancas: number;
    valorTotalEmAberto: number;
    valorTotalVencido: number;
    cobrancasVencidas: number;
    cobrancasPagas: number;
  }> {
    const { data, error } = await supabase
      .from('cobrancas')
      .select('status, valor_atualizado, vencimento');

    if (error) {
      throw new Error(error.message);
    }

    const dataAtual = new Date();
    const estatisticas = {
      totalCobrancas: data.length,
      valorTotalEmAberto: 0,
      valorTotalVencido: 0,
      cobrancasVencidas: 0,
      cobrancasPagas: 0,
    };

    data.forEach(cobranca => {
      const dataVencimento = new Date(cobranca.vencimento);
      const isVencida = dataVencimento < dataAtual;

      if (cobranca.status === 'pago') {
        estatisticas.cobrancasPagas++;
      } else {
        estatisticas.valorTotalEmAberto += Number(cobranca.valor_atualizado || 0);
        
        if (isVencida) {
          estatisticas.cobrancasVencidas++;
          estatisticas.valorTotalVencido += Number(cobranca.valor_atualizado || 0);
        }
      }
    });

    return estatisticas;
  }

  async criarNegociacao(negociacao: Omit<NegociacaoCobranca, 'id' | 'data_criacao'>): Promise<NegociacaoCobranca> {
    const negociacaoData = {
      ...negociacao,
      data_criacao: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('negociacoes_cobrancas')
      .insert(negociacaoData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async obterNegociacoes(cobrancaId: string): Promise<NegociacaoCobranca[]> {
    const { data, error } = await supabase
      .from('negociacoes_cobrancas')
      .select('*')
      .eq('cobranca_id', cobrancaId)
      .order('data_criacao', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async atualizarStatusNegociacao(id: string, status: NegociacaoCobranca['status']): Promise<NegociacaoCobranca> {
    const { data, error } = await supabase
      .from('negociacoes_cobrancas')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const cobrancasService = new CobrancasService();
