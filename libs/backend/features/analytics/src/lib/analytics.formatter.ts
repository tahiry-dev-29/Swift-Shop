import { Injectable } from '@nestjs/common';
import { DashboardStatsType, SalesChartPointType, TopProductType } from './dto';
import {
  DashboardStatsRow,
  SalesChartRow,
  TopProductSalesRow,
  TopProductViewRow,
} from './interfaces/analytics-row.interface';

interface ProductSummary {
  id: string;
  name: string;
  reference: string;
}

@Injectable()
export class AnalyticsFormatter {
  toDashboardStats(row: DashboardStatsRow): DashboardStatsType {
    const ordersCount = this.toNumber(row.ordersCount);

    return {
      ordersCount,
      itemsSold: this.toNumber(row.itemsSold),
      grossSales: this.toNumber(row.grossSales),
      netSales: this.toNumber(row.netSales),
      taxTotal: this.toNumber(row.taxTotal),
      averageOrder:
        ordersCount > 0 ? this.toNumber(row.grossSales) / ordersCount : 0,
      productViews: this.toNumber(row.productViews),
    };
  }

  toSalesChart(rows: SalesChartRow[]): SalesChartPointType[] {
    return rows.map((row) => ({
      date: row.date,
      ordersCount: this.toNumber(row.ordersCount),
      itemsSold: this.toNumber(row.itemsSold),
      grossSales: this.toNumber(row.grossSales),
      netSales: this.toNumber(row.netSales),
    }));
  }

  toTopProducts(
    salesRows: TopProductSalesRow[],
    viewRows: TopProductViewRow[],
    products: ProductSummary[],
  ): TopProductType[] {
    const viewsByProduct = new Map(
      viewRows.map((row) => [row.productId, this.toNumber(row.views)]),
    );
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    return salesRows.map((row) => {
      const product = productById.get(row.productId);

      return {
        productId: row.productId,
        name: product?.name ?? 'Unknown product',
        reference: product?.reference ?? row.productId,
        quantitySold: this.toNumber(row.quantitySold),
        revenue: this.toNumber(row.revenue),
        views: viewsByProduct.get(row.productId) ?? 0,
      };
    });
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'object' && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }

    return Number(value);
  }
}
