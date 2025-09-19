import { asaasSyncService } from './asaasSyncService';

interface SyncResult {
  created: number;
  updated: number;
  errors: string[];
}

interface AutoSyncConfig {
  enabled: boolean;
  intervalMinutes: number;
  syncPayments: boolean;
  syncStatuses: boolean;
  paymentsSyncInterval: number; // Intervalo específico para sync de payments (em horas)
}

class AutoSyncService {
  private statusSyncInterval: NodeJS.Timeout | null = null;
  private paymentsSyncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  
  private config: AutoSyncConfig = {
    enabled: false,
    intervalMinutes: 30, // Sync de status a cada 30 minutos
    syncPayments: true,
    syncStatuses: true,
    paymentsSyncInterval: 4 // Sync de payments a cada 4 horas
  };

  private lastPaymentsSync: Date | null = null;
  private lastStatusSync: Date | null = null;

  /**
   * Inicia a sincronização automática
   */
  startAutoSync(config?: Partial<AutoSyncConfig>): void {
    try {
      // Atualizar configuração
      if (config) {
        this.config = { ...this.config, ...config };
      }

      if (!this.config.enabled) {
        console.log('🔒 Sincronização automática está desabilitada');
        return;
      }

      this.stopAutoSync();
      this.isRunning = true;

      console.log('🚀 Iniciando sincronização automática com configuração:', this.config);

      // Configurar sync de status (mais frequente)
      if (this.config.syncStatuses) {
        this.statusSyncInterval = setInterval(async () => {
          await this.executeStatusSync();
        }, this.config.intervalMinutes * 60 * 1000);

        // Executar sync de status imediatamente
        setTimeout(() => this.executeStatusSync(), 5000);
      }

      // Configurar sync de payments (menos frequente)
      if (this.config.syncPayments) {
        this.paymentsSyncInterval = setInterval(async () => {
          await this.executePaymentsSync();
        }, this.config.paymentsSyncInterval * 60 * 60 * 1000);

        // Executar sync de payments após 1 minuto
        setTimeout(() => this.executePaymentsSync(), 60000);
      }

      console.log(`✅ Sincronização automática iniciada:
        - Status: a cada ${this.config.intervalMinutes} minutos
        - Payments: a cada ${this.config.paymentsSyncInterval} horas`);
    } catch (error) {
      console.error('❌ Erro ao iniciar sincronização automática:', error);
    }
  }

  /**
   * Para a sincronização automática
   */
  stopAutoSync(): void {
    if (this.statusSyncInterval) {
      clearInterval(this.statusSyncInterval);
      this.statusSyncInterval = null;
    }

    if (this.paymentsSyncInterval) {
      clearInterval(this.paymentsSyncInterval);
      this.paymentsSyncInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 Sincronização automática parada');
  }

  /**
   * Executa sincronização de status
   */
  private async executeStatusSync(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log('🔄 Executando sincronização automática de status...');
      const result = await asaasSyncService.syncAllStatuses();
      this.lastStatusSync = new Date();
      
      if (result.updated > 0 || result.errors.length > 0) {
        console.log(`✅ Sync Status: ${result.updated} atualizados, ${result.errors.length} erros`);
      }
    } catch (error) {
      console.error('❌ Erro na sincronização automática de status:', error);
    }
  }

  /**
   * Executa sincronização de payments
   */
  private async executePaymentsSync(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log('🔄 Executando sincronização automática de payments...');
      
      // Sync dos últimos 7 dias para capturar novos payments
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 7);
      
      const result = await asaasSyncService.syncAllPayments({
        dateFrom: dateFrom.toISOString().split('T')[0],
        limit: 200
      });
      
      this.lastPaymentsSync = new Date();
      
      if (result.created > 0 || result.updated > 0 || result.errors.length > 0) {
        console.log(`✅ Sync Payments: ${result.created} criados, ${result.updated} atualizados, ${result.errors.length} erros`);
      }
    } catch (error) {
      console.error('❌ Erro na sincronização automática de payments:', error);
    }
  }

  /**
   * Executa sincronização completa manual
   */
  async executeFullSync(): Promise<{
    paymentsResult: SyncResult | null;
    statusResult: SyncResult | null;
    errors: string[];
  }> {
    console.log('🔄 Executando sincronização completa...');
    const errors: string[] = [];
    let paymentsResult: SyncResult | null = null;
    let statusResult: SyncResult | null = null;

    try {
      // Sync de payments dos últimos 30 dias
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 30);
      
      paymentsResult = await asaasSyncService.syncAllPayments({
        dateFrom: dateFrom.toISOString().split('T')[0],
        limit: 500
      });
      
      this.lastPaymentsSync = new Date();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(`Payments: ${errorMessage}`);
    }

    try {
      statusResult = await asaasSyncService.syncAllStatuses();
      this.lastStatusSync = new Date();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(`Status: ${errorMessage}`);
    }

    console.log('✅ Sincronização completa finalizada');
    return { paymentsResult, statusResult, errors };
  }

  /**
   * Retorna o status da sincronização automática
   */
  getStatus(): {
    isRunning: boolean;
    config: AutoSyncConfig;
    lastPaymentsSync: Date | null;
    lastStatusSync: Date | null;
    nextPaymentsSync: Date | null;
    nextStatusSync: Date | null;
  } {
    let nextPaymentsSync: Date | null = null;
    if (this.lastPaymentsSync && this.config.syncPayments) {
      nextPaymentsSync = new Date(this.lastPaymentsSync.getTime() + (this.config.paymentsSyncInterval * 60 * 60 * 1000));
    }
    
    let nextStatusSync: Date | null = null;
    if (this.lastStatusSync && this.config.syncStatuses) {
      nextStatusSync = new Date(this.lastStatusSync.getTime() + (this.config.intervalMinutes * 60 * 1000));
    }

    return {
      isRunning: this.isRunning,
      config: this.config,
      lastPaymentsSync: this.lastPaymentsSync,
      lastStatusSync: this.lastStatusSync,
      nextPaymentsSync,
      nextStatusSync
    };
  }

  /**
   * Atualiza a configuração da sincronização automática
   */
  updateConfig(newConfig: Partial<AutoSyncConfig>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stopAutoSync();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning && this.config.enabled) {
      this.startAutoSync();
    }
    
    console.log('⚙️ Configuração da sincronização atualizada:', this.config);
  }

  /**
   * Força uma sincronização imediata de status
   */
  async forceSyncStatuses(): Promise<void> {
    return await this.executeStatusSync();
  }

  /**
   * Força uma sincronização imediata de payments
   */
  async forceSyncPayments(): Promise<void> {
    return await this.executePaymentsSync();
  }
}

export const autoSyncService = new AutoSyncService();