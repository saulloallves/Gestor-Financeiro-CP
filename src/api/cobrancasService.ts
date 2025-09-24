import { supabase } from './supabaseClient';
import { asaasService } from './asaasService';
import { configuracoesService } from './configuracoesService';
import type { 
  Cobranca, 
  CriarCobrancaData, 
  EditarCobrancaData, 
  CobrancasFilters,
  NegociacaoCobranca,
  CobrancaFormData 
} from '../types/cobrancas';

class CobrancasService {
  async listarCobrancas(filters?: CobrancasFilters): Promise<Cobranca[]> {
    let query = supabase
      .from('cobrancas')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.codigo_unidade) {
      query = query.eq('codigo_unidade', filters.codigo_unidade);
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
      .select('*')
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
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    try {
      // Integração com ASAAS será implementada futuramente
      // quando tivermos os dados do franqueado disponíveis
      console.log('Cobrança criada para a unidade:', cobranca.codigo_unidade);
    } catch (asaasError) {
      console.error('Erro na integração ASAAS:', asaasError);
    }

    return cobranca;
  }

  /**
   * Cria cobrança integrada com ASAAS (novo método para Fase 2)
   * Usa a nova lógica de buscar/criar customer automaticamente
   */
  async criarCobrancaIntegrada(dados: CobrancaFormData): Promise<Cobranca> {
    console.log('🚀 [INTEGRAÇÃO] Iniciando criação de cobrança integrada...');
    console.log('📋 Dados recebidos:', dados);

    // 1. Preparar dados base da cobrança (apenas campos da tabela)
    const cobrancaBase: CriarCobrancaData = {
      codigo_unidade: dados.codigo_unidade,
      tipo_cobranca: dados.tipo_cobranca,
      valor_original: dados.valor_original,
      valor_atualizado: dados.valor_original,
      vencimento: dados.vencimento.toISOString(),
      observacoes: dados.observacoes,
      status: 'pendente',
      juros_aplicado: 0,
      multa_aplicada: 0,
      dias_atraso: 0,
    };

    // 2. Se não deve criar no ASAAS, usar método tradicional
    if (!dados.criar_no_asaas) {
      console.log('📝 Criando cobrança apenas local (sem ASAAS)');
      return await this.criarCobranca(cobrancaBase);
    }

    // 3. Validar dados para integração ASAAS
    if (!dados.cliente_selecionado) {
      throw new Error('Cliente selecionado é obrigatório para integração ASAAS');
    }

    console.log('🔗 Integrando com ASAAS...');
    console.log('👤 Cliente selecionado:', JSON.stringify(dados.cliente_selecionado, null, 2));

    // Validar campos obrigatórios do cliente
    if (!dados.cliente_selecionado.nome || dados.cliente_selecionado.nome.trim() === '') {
      throw new Error('Nome do cliente é obrigatório para integração ASAAS');
    }
    if (!dados.cliente_selecionado.documento || dados.cliente_selecionado.documento.trim() === '') {
      throw new Error('Documento do cliente é obrigatório para integração ASAAS');
    }

    console.log('✅ Validações OK - Cliente:', dados.cliente_selecionado.nome);

    try {
      // 4. Buscar ou criar customer no ASAAS
      const { customer, isNew } = await asaasService.findOrCreateCustomer({
        tipo: dados.cliente_selecionado.tipo,
        documento: dados.cliente_selecionado.documento,
        nome: dados.cliente_selecionado.nome,
        email: dados.cliente_selecionado.email,
        telefone: dados.cliente_selecionado.telefone,
      });

      console.log(`${isNew ? '✨ Novo' : '✅ Existente'} customer ASAAS: ${customer.id}`);

      // 5. Criar payment no ASAAS
      const paymentData = {
        customer: customer.id!,
        billingType: 'BOLETO' as const,
        value: dados.valor_original,
        dueDate: dados.vencimento.toISOString().split('T')[0], // YYYY-MM-DD
        description: `${dados.tipo_cobranca.toUpperCase()} - Unidade ${dados.codigo_unidade}`,
        externalReference: `unidade-${dados.codigo_unidade}-${Date.now()}`,
      };

      console.log('💳 Criando payment no ASAAS...');
      const payment = await asaasService.createPayment(paymentData);
      console.log('✅ Payment criado:', payment.id);

      // 6. Tentar obter URLs do boleto e pagamento (com fallback)
      console.log('🔗 Tentando obter URLs do boleto...');
      let boletoUrl: string | undefined;
      let linkPagamento: string | undefined;

      try {
        // As URLs já vêm na resposta da criação do payment
        boletoUrl = payment.bankSlipUrl;
        linkPagamento = payment.invoiceUrl;
        
        if (boletoUrl) console.log('✅ URL do boleto obtida da criação');
        if (linkPagamento) console.log('✅ URL de pagamento obtida da criação');

      } catch (urlError) {
        console.warn('⚠️ Erro geral ao obter URLs:', urlError);
      }

      // 7. Salvar cobrança com dados ASAAS (mesmo sem URLs)
      const cobrancaCompleta: CriarCobrancaData = {
        ...cobrancaBase,
        asaas_customer_id: customer.id,
        asaas_payment_id: payment.id,
        ...(boletoUrl && { link_boleto: boletoUrl }),
        ...(linkPagamento && { link_pagamento: linkPagamento }),
      };

      console.log('💾 Salvando cobrança no banco local...');
      const { data: cobranca, error } = await supabase
        .from('cobrancas')
        .insert(cobrancaCompleta)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erro ao salvar cobrança:', error);
        throw new Error(`Erro ao salvar cobrança: ${error.message}`);
      }

      console.log('🎉 Cobrança integrada criada com sucesso!');
      console.log('📋 ID Local:', cobranca.id);
      console.log('🏦 ID ASAAS Payment:', payment.id);
      console.log('👤 ID ASAAS Customer:', customer.id);

      return cobranca;

    } catch (asaasError) {
      console.error('❌ Erro na integração ASAAS:', asaasError);
      
      // Fallback: criar cobrança local com indicação de erro
      console.log('🔄 Criando cobrança local como fallback...');
      const cobrancaFallbackData: CriarCobrancaData = {
        ...cobrancaBase,
        observacoes: `${dados.observacoes || ''}\n\n[ERRO ASAAS: ${asaasError}]`.trim(),
      };

      const { error } = await supabase
        .from('cobrancas')
        .insert(cobrancaFallbackData)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Erro crítico: falha na integração ASAAS E no banco local: ${error.message}`);
      }

      // Re-throw o erro ASAAS para o usuário saber que houve problema
      throw new Error(`Cobrança criada localmente, mas falhou integração ASAAS: ${asaasError}`);
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
      .select('*')
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
      .select('*')
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

    if (!cobranca.asaas_payment_id) {
      throw new Error('Esta cobrança não foi criada no ASAAS. Crie uma nova cobrança com a integração ativada.');
    }

    // Já tem boleto ASAAS, apenas obter os detalhes do payment
    const payment = await asaasService.getPayment(cobranca.asaas_payment_id);
    const boletoUrl = payment.bankSlipUrl;
    const linkPagamento = payment.invoiceUrl;

    if (!boletoUrl || !linkPagamento) {
      throw new Error('Não foi possível obter as URLs do boleto. Verifique o status da cobrança no ASAAS.');
    }
    
    // Atualizar URLs no banco para garantir que estão sincronizadas
    await supabase
      .from('cobrancas')
      .update({ 
        link_boleto: boletoUrl,
        link_pagamento: linkPagamento,
      })
      .eq('id', id);

    return { boleto_url: boletoUrl, link_pagamento: linkPagamento };
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
      .select('*')
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

  /**
   * Cria cobrança no ASAAS e sincroniza com banco local
   */
  async criarCobrancaComAsaas(dados: CriarCobrancaData & {
    customerData: {
      name: string;
      cpfCnpj: string;
      email?: string;
      phone?: string;
      address?: string;
      addressNumber?: string;
      complement?: string;
      province?: string;
      city?: string;
      state?: string;
      postalCode?: string;
    };
    billingType?: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
    generateBankSlip?: boolean;
  }): Promise<Cobranca> {
    try {
      console.log('🔄 Criando cobrança com integração ASAAS...');

      // 1. Buscar ou criar customer no ASAAS
      let customerId: string;
      const cpfCnpjLimpo = dados.customerData.cpfCnpj.replace(/\D/g, '');
      
      // Buscar customer existente
      const customers = await asaasService.getCustomers({
        cpfCnpj: cpfCnpjLimpo
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id!;
        console.log(`✅ Customer existente encontrado: ${customerId}`);
      } else {
        // Criar novo customer
        const newCustomer = await asaasService.createCustomer({
          name: dados.customerData.name,
          cpfCnpj: cpfCnpjLimpo,
          email: dados.customerData.email,
          phone: dados.customerData.phone,
          address: dados.customerData.address,
          addressNumber: dados.customerData.addressNumber,
          complement: dados.customerData.complement,
          province: dados.customerData.province,
          city: dados.customerData.city,
          state: dados.customerData.state,
          postalCode: dados.customerData.postalCode?.replace(/\D/g, '')
        });
        customerId = newCustomer.id!;
        console.log(`✅ Novo customer criado: ${customerId}`);
      }

      // 2. Criar payment no ASAAS
      const paymentData = {
        customer: customerId,
        billingType: dados.billingType || 'BOLETO',
        value: dados.valor_original,
        dueDate: dados.vencimento,
        description: dados.observacoes || `Cobrança ${dados.tipo_cobranca} - Unidade ${dados.codigo_unidade}`,
        externalReference: `UN${dados.codigo_unidade}-${Date.now()}`,
        installmentCount: 1,
        totalValue: dados.valor_original
      };

      console.log('📝 Criando payment no ASAAS:', paymentData);
      const payment = await asaasService.createPayment(paymentData);
      console.log('✅ Payment criado no ASAAS:', payment.id);

      // 3. Salvar no banco local
      const cobrancaData: CriarCobrancaData = {
        codigo_unidade: dados.codigo_unidade,
        tipo_cobranca: dados.tipo_cobranca,
        valor_original: dados.valor_original,
        valor_atualizado: dados.valor_original,
        vencimento: dados.vencimento,
        status: 'pendente',
        observacoes: dados.observacoes || '',
        juros_aplicado: 0,
        multa_aplicada: 0,
        dias_atraso: 0,
        asaas_payment_id: payment.id,
        asaas_customer_id: customerId,
        boleto_id: payment.billingType === 'BOLETO' ? payment.id : undefined,
        link_boleto: payment.bankSlipUrl || undefined
      };

      const { data: cobranca, error } = await supabase
        .from('cobrancas')
        .insert(cobrancaData)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Erro ao salvar cobrança no banco: ${error.message}`);
      }

      console.log('✅ Cobrança salva no banco local:', cobranca.id);
      return cobranca;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro ao criar cobrança com ASAAS:', errorMessage);
      throw new Error(`Erro ao criar cobrança com ASAAS: ${errorMessage}`);
    }
  }

  /**
   * Atualiza uma cobrança existente no ASAAS
   */
  async atualizarCobrancaAsaas(cobrancaId: string, dados: {
    value?: number;
    dueDate?: string;
    description?: string;
  }): Promise<Cobranca> {
    try {
      // Buscar a cobrança local
      const { data: cobranca, error: fetchError } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('id', cobrancaId)
        .single();

      if (fetchError || !cobranca) {
        throw new Error('Cobrança não encontrada');
      }

      if (!cobranca.asaas_payment_id) {
        throw new Error('Cobrança não possui ID do ASAAS');
      }

      // Atualizar no ASAAS
      await asaasService.updatePayment(cobranca.asaas_payment_id, dados);

      // Atualizar no banco local
      const updateData: Partial<Cobranca> = {
        updated_at: new Date().toISOString()
      };

      if (dados.value) {
        updateData.valor_atualizado = dados.value;
      }
      if (dados.dueDate) {
        updateData.vencimento = dados.dueDate;
      }
      if (dados.description) {
        updateData.observacoes = dados.description;
      }

      const { data: updatedCobranca, error: updateError } = await supabase
        .from('cobrancas')
        .update(updateData)
        .eq('id', cobrancaId)
        .select('*')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      return updatedCobranca;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao atualizar cobrança no ASAAS: ${errorMessage}`);
    }
  }

  /**
   * Cancela uma cobrança no ASAAS
   */
  async cancelarCobrancaAsaas(cobrancaId: string): Promise<Cobranca> {
    try {
      // Buscar a cobrança local
      const { data: cobranca, error: fetchError } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('id', cobrancaId)
        .single();

      if (fetchError || !cobranca) {
        throw new Error('Cobrança não encontrada');
      }

      if (!cobranca.asaas_payment_id) {
        throw new Error('Cobrança não possui ID do ASAAS');
      }

      // Cancelar no ASAAS
      await asaasService.deletePayment(cobranca.asaas_payment_id);

      // Atualizar status no banco local
      const { data: updatedCobranca, error: updateError } = await supabase
        .from('cobrancas')
        .update({ 
          status: 'cancelado',
          updated_at: new Date().toISOString()
        })
        .eq('id', cobrancaId)
        .select('*')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      return updatedCobranca;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Erro ao cancelar cobrança no ASAAS: ${errorMessage}`);
    }
  }
}

export const cobrancasService = new CobrancasService();