import { Injectable } from '@nestjs/common';
import { StockAlertRow } from './interfaces/stock-alert-row.interface';

@Injectable()
export class StockAlertFormatter {
  /**
   * Format display name resolving product or variant specifications.
   */
  formatItemName(stock: StockAlertRow): string {
    if (stock.combinationRef) {
      return `${stock.combinationProductName} (Comb: ${stock.combinationRef})`;
    }
    return stock.productName ?? 'Unknown Product';
  }
}
