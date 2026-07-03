import { Injectable, NotFoundException } from '@nestjs/common';
import { AnalyticsFormatter } from './analytics.formatter';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsDateRange } from './interfaces/analytics-row.interface';
import { TrackProductViewInput } from './dto';

const DEFAULT_RANGE_DAYS = 30;
const MAX_TOP_PRODUCTS = 50;

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly analyticsFormatter: AnalyticsFormatter,
  ) {}

  async getDashboardStats(range: AnalyticsDateRange = {}) {
    const normalizedRange = this.normalizeRange(range);
    const stats =
      await this.analyticsRepository.getDashboardStats(normalizedRange);

    return this.analyticsFormatter.toDashboardStats(stats);
  }

  async getSalesChart(range: AnalyticsDateRange = {}) {
    const normalizedRange = this.normalizeRange(range);
    const rows = await this.analyticsRepository.getSalesChart(normalizedRange);

    return this.analyticsFormatter.toSalesChart(rows);
  }

  async getTopProducts(range: AnalyticsDateRange = {}, limit = 10) {
    const normalizedRange = this.normalizeRange(range);
    const safeLimit = Math.min(Math.max(limit, 1), MAX_TOP_PRODUCTS);
    const salesRows = await this.analyticsRepository.getTopProductSales(
      normalizedRange,
      safeLimit,
    );
    const productIds = salesRows.map((row) => row.productId);
    const [viewRows, products] = await Promise.all([
      this.analyticsRepository.getProductViewsByProduct(
        normalizedRange,
        productIds,
      ),
      this.analyticsRepository.findProductsByIds(productIds),
    ]);

    return this.analyticsFormatter.toTopProducts(salesRows, viewRows, products);
  }

  async trackProductView(input: TrackProductViewInput) {
    const product = await this.analyticsRepository.findProductById(
      input.productId,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.analyticsRepository.createProductViewEvent(input);
  }

  private normalizeRange(
    range: AnalyticsDateRange,
  ): Required<AnalyticsDateRange> {
    const to = range.to ?? new Date();
    const from =
      range.from ??
      new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

    return { from, to };
  }
}
