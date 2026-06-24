import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { StockAlertRow } from './interfaces/stock-alert-row.interface';

@Injectable()
export class StockAlertRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute optimized raw SQL query to fetch low stock metrics.
   */
  async findLowStockItems(): Promise<StockAlertRow[]> {
    return this.prisma.$queryRaw<StockAlertRow[]>`
      SELECT s.id, s.quantity, s."minQuantity", 
             p.name as "productName", p.reference as "productRef",
             c.reference as "combinationRef", cp.name as "combinationProductName"
      FROM "Stock" s
      LEFT JOIN "Product" p ON s."productId" = p.id
      LEFT JOIN "ProductCombination" c ON s."combinationId" = c.id
      LEFT JOIN "Product" cp ON c."productId" = cp.id
      WHERE s.quantity <= s."minQuantity"
    `;
  }
}
