import { Injectable } from '@nestjs/common';
import { Prisma, ProductViewEvent } from '@dima-new/prisma-client';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  AnalyticsDateRange,
  DashboardStatsRow,
  SalesChartRow,
  TopProductSalesRow,
  TopProductViewRow,
} from './interfaces/analytics-row.interface';
import { TrackProductViewInput } from './dto';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(range: Required<AnalyticsDateRange>) {
    const [salesRow] = await this.prisma.$queryRaw<DashboardStatsRow[]>`
      WITH order_stats AS (
        SELECT
          o.id,
          o."totalTTC",
          o."totalHT",
          o."totalTax",
          o."discountTotal",
          o."shippingTotal"
        FROM "Order" o
        LEFT JOIN "OrderState" os ON os.id = o."stateId"
        WHERE o."dateAdd" >= ${range.from}
          AND o."dateAdd" <= ${range.to}
          AND os.name NOT IN ('CANCELLED', 'RETURNED')
      ),
      item_stats AS (
        SELECT
          COALESCE(SUM(oi.quantity), 0)::int AS "itemsSold"
        FROM "Order" o
        LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
        LEFT JOIN "OrderState" os ON os.id = o."stateId"
        WHERE o."dateAdd" >= ${range.from}
          AND o."dateAdd" <= ${range.to}
          AND os.name NOT IN ('CANCELLED', 'RETURNED')
      )
      SELECT
        (SELECT COUNT(*)::int FROM order_stats) AS "ordersCount",
        (SELECT "itemsSold" FROM item_stats) AS "itemsSold",
        COALESCE((SELECT SUM("totalTTC" + "discountTotal" - "shippingTotal") FROM order_stats), 0) AS "grossSales",
        COALESCE((SELECT SUM("totalHT") FROM order_stats), 0) AS "netSales",
        COALESCE((SELECT SUM("totalTax") FROM order_stats), 0) AS "taxTotal",
        0::int AS "productViews"
    `;

    const productViews = await this.countProductViews(range);

    return {
      ordersCount: salesRow?.ordersCount ?? 0,
      itemsSold: salesRow?.itemsSold ?? 0,
      grossSales: salesRow?.grossSales ?? 0,
      netSales: salesRow?.netSales ?? 0,
      taxTotal: salesRow?.taxTotal ?? 0,
      productViews,
    };
  }

  getSalesChart(range: Required<AnalyticsDateRange>) {
    return this.prisma.$queryRaw<SalesChartRow[]>`
      WITH order_days AS (
        SELECT
          DATE_TRUNC('day', o."dateAdd")::date AS "date",
          o.id,
          o."totalTTC",
          o."totalHT",
          o."discountTotal",
          o."shippingTotal"
        FROM "Order" o
        LEFT JOIN "OrderState" os ON os.id = o."stateId"
        WHERE o."dateAdd" >= ${range.from}
          AND o."dateAdd" <= ${range.to}
          AND os.name NOT IN ('CANCELLED', 'RETURNED')
      ),
      item_days AS (
        SELECT
          DATE_TRUNC('day', o."dateAdd")::date AS "date",
          COALESCE(SUM(oi.quantity), 0)::int AS "itemsSold"
        FROM "Order" o
        LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
        LEFT JOIN "OrderState" os ON os.id = o."stateId"
        WHERE o."dateAdd" >= ${range.from}
          AND o."dateAdd" <= ${range.to}
          AND os.name NOT IN ('CANCELLED', 'RETURNED')
        GROUP BY DATE_TRUNC('day', o."dateAdd")::date
      )
      SELECT
        od."date",
        COUNT(DISTINCT od.id)::int AS "ordersCount",
        COALESCE(MAX(id.itemsSold), 0)::int AS "itemsSold",
        COALESCE(SUM(od."totalTTC" + od."discountTotal" - od."shippingTotal"), 0) AS "grossSales",
        COALESCE(SUM(od."totalHT"), 0) AS "netSales"
      FROM order_days od
      LEFT JOIN item_days id ON id."date" = od."date"
      GROUP BY od."date"
      ORDER BY od."date" ASC
    `;
  }

  getTopProductSales(range: Required<AnalyticsDateRange>, limit: number) {
    return this.prisma.$queryRaw<TopProductSalesRow[]>`
      SELECT
        oi."productId" AS "productId",
        COALESCE(SUM(oi.quantity), 0)::int AS "quantitySold",
        COALESCE(SUM(oi."totalTTC"), 0) AS "revenue"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "OrderState" os ON os.id = o."stateId"
      WHERE o."dateAdd" >= ${range.from}
        AND o."dateAdd" <= ${range.to}
        AND os.name NOT IN ('CANCELLED', 'RETURNED')
      GROUP BY oi."productId"
      ORDER BY "revenue" DESC, "quantitySold" DESC
      LIMIT ${limit}
    `;
  }

  getProductViewsByProduct(
    range: Required<AnalyticsDateRange>,
    productIds?: string[],
  ) {
    const productFilter =
      productIds && productIds.length > 0
        ? Prisma.sql`AND "productId" IN (${Prisma.join(productIds)})`
        : Prisma.empty;

    return this.prisma.$queryRaw<TopProductViewRow[]>`
      SELECT
        "productId",
        COUNT(*)::int AS "views"
      FROM "ProductViewEvent"
      WHERE "dateAdd" >= ${range.from}
        AND "dateAdd" <= ${range.to}
        ${productFilter}
      GROUP BY "productId"
      ORDER BY "views" DESC
    `;
  }

  findProductsByIds(productIds: string[]) {
    return this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, reference: true },
    });
  }

  findProductById(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
  }

  createProductViewEvent(
    input: TrackProductViewInput,
  ): Promise<ProductViewEvent> {
    return this.prisma.productViewEvent.create({
      data: {
        productId: input.productId,
        customerId: input.customerId,
        sessionId: input.sessionId,
        source: input.source,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
    });
  }

  private countProductViews(range: Required<AnalyticsDateRange>) {
    return this.prisma.productViewEvent.count({
      where: {
        dateAdd: {
          gte: range.from,
          lte: range.to,
        },
      },
    });
  }
}
