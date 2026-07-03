export interface AnalyticsDateRange {
  from?: Date;
  to?: Date;
}

export interface DashboardStatsRow {
  ordersCount: number;
  itemsSold: number | null;
  grossSales: unknown;
  netSales: unknown;
  taxTotal: unknown;
  productViews: number;
}

export interface SalesChartRow {
  date: Date;
  ordersCount: number;
  itemsSold: number | null;
  grossSales: unknown;
  netSales: unknown;
}

export interface TopProductSalesRow {
  productId: string;
  quantitySold: number;
  revenue: unknown;
}

export interface TopProductViewRow {
  productId: string;
  views: number;
}
