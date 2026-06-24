import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StockAlertRepository } from './stock-alert.repository';
import { StockAlertFormatter } from './stock-alert.formatter';
import { StockAlertRow } from './interfaces/stock-alert-row.interface';

@Injectable()
export class StockAlertService {
  private readonly logger = new Logger(StockAlertService.name);

  constructor(
    private readonly repository: StockAlertRepository,
    private readonly formatter: StockAlertFormatter,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkLowStock(): Promise<void> {
    this.logger.log('Starting daily automated low stock inspection...');

    try {
      const lowStocks = await this.repository.findLowStockItems();

      if (lowStocks.length === 0) {
        this.logger.log('Inspection complete: No low stock items detected.');
        return;
      }

      this.logger.warn(
        `Alert triggered: ${lowStocks.length} items require attention.`,
      );
      this.processAlerts(lowStocks);
    } catch (error) {
      this.logger.error(
        'Critical failure during low stock inspection process',
        error,
      );
    }
  }

  /**
   * Buffer and process alerts using batched logs to prevent thread blocking.
   */
  private processAlerts(lowStocks: StockAlertRow[]): void {
    const summary = lowStocks.map((stock) => {
      const name = this.formatter.formatItemName(stock);
      return ` - ${name} | Qty: ${stock.quantity} (Min: ${stock.minQuantity})`;
    });

    // Rare & Safe approach: single log point to avoid production overhead
    this.logger.warn(`Low Stock Master Summary:\n${summary.join('\n')}`);

    // TODO: Inject NotificationService to dispatch single aggregated report
  }
}
