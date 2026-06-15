import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@dima-new/data-access-prisma';

@Injectable()
export class StockAlertService {
  private readonly logger = new Logger(StockAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkLowStock() {
    this.logger.log('Running daily low stock check...');

    try {
      // Production-ready: Use raw SQL to natively compare two columns efficiently
      const lowStocks = await this.prisma.$queryRaw<any[]>`
        SELECT s.id, s.quantity, s."minQuantity", 
               p.name as "productName", p.reference as "productRef",
               c.reference as "combinationRef", cp.name as "combinationProductName"
        FROM "Stock" s
        LEFT JOIN "Product" p ON s."productId" = p.id
        LEFT JOIN "ProductCombination" c ON s."combinationId" = c.id
        LEFT JOIN "Product" cp ON c."productId" = cp.id
        WHERE s.quantity <= s."minQuantity"
      `;

      if (lowStocks.length > 0) {
        this.logger.warn(`Found ${lowStocks.length} items with low stock!`);

        for (const stock of lowStocks) {
          const itemName = stock.combinationRef
            ? `${stock.combinationProductName} (Comb: ${stock.combinationRef})`
            : stock.productName;

          this.logger.warn(
            `Low Stock Alert: ${itemName} - Qty: ${stock.quantity} (Min: ${stock.minQuantity})`,
          );
        }

        // TODO: Send an email to the admin
      } else {
        this.logger.log('No low stock items found.');
      }
    } catch (error) {
      this.logger.error('Failed to run low stock check', error);
    }
  }
}
