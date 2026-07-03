import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

    if (salesRows.length === 0) {
      return [];
    }

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

    const ipAddress = this.anonymizeIp(input.ipAddress);

    return this.analyticsRepository.createProductViewEvent({
      ...input,
      ipAddress,
    });
  }

  private anonymizeIp(ip?: string): string | undefined {
    if (!ip) {
      return undefined;
    }

    const parts = ip.split(',');
    const primaryIp = parts[0].trim();

    // IPv4
    if (primaryIp.includes('.')) {
      const octets = primaryIp.split('.');
      if (octets.length === 4) {
        octets[3] = '0';
        return octets.join('.');
      }
    }

    // IPv6
    if (primaryIp.includes(':')) {
      const segments = primaryIp.split(':');
      if (segments.length >= 3) {
        return segments.slice(0, 3).join(':') + ':0:0:0:0:0';
      }
    }

    return primaryIp;
  }

  private normalizeRange(
    range: AnalyticsDateRange,
  ): Required<AnalyticsDateRange> {
    const to = range.to ?? new Date();
    const from =
      range.from ??
      new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException(
        'Invalid date range: from date cannot be later than to date',
      );
    }

    return { from, to };
  }
}
