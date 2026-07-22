import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsResolver Integration Tests', () => {
  let resolver: AnalyticsResolver;
  let serviceMock: Mocked<AnalyticsService>;

  beforeEach(() => {
    serviceMock = {
      getDashboardStats: vi.fn(),
      getSalesChart: vi.fn(),
      getTopProducts: vi.fn(),
      trackProductView: vi.fn(),
    } as unknown as Mocked<AnalyticsService>;

    resolver = new AnalyticsResolver(serviceMock);
  });

  it('getDashboardStats — returns KPI data', async () => {
    serviceMock.getDashboardStats.mockResolvedValue({
      ordersCount: 50,
      itemsSold: 120,
      grossSales: 5000,
      netSales: 4200,
      taxTotal: 800,
      productViews: 1000,
    } as never);

    const stats = await resolver.getDashboardStats();

    expect(stats.ordersCount).toBe(50);
  });

  it('getSalesChart — returns chart points', async () => {
    serviceMock.getSalesChart.mockResolvedValue([
      { date: '2026-07-22', grossSales: 500, ordersCount: 5 } as never,
    ]);

    const points = await resolver.getSalesChart();

    expect(points).toHaveLength(1);
  });

  it('trackProductView — extracts IP from context headers and records view event', async () => {
    const mockContext = {
      req: {
        ip: '127.0.0.1',
        headers: {
          'x-forwarded-for': '203.0.113.195',
          'user-agent': 'Mozilla',
        },
      },
    };
    serviceMock.trackProductView.mockResolvedValue({
      id: 'pve-1',
      productId: 'prod-100',
    } as never);

    await resolver.trackProductView(
      mockContext,
      { id: 'cust-1' },
      {
        productId: 'prod-100',
        source: 'web',
      },
    );

    expect(serviceMock.trackProductView).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod-100',
        customerId: 'cust-1',
        ipAddress: '203.0.113.195',
      }),
    );
  });
});
