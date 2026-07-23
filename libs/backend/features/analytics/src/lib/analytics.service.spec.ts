import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsFormatter } from './analytics.formatter';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repoMock: Mocked<AnalyticsRepository>;
  let formatter: AnalyticsFormatter;

  beforeEach(() => {
    repoMock = {
      getDashboardStats: vi.fn(),
      getSalesChart: vi.fn(),
      getTopProductSales: vi.fn(),
      getProductViewsByProduct: vi.fn(),
      findProductsByIds: vi.fn(),
      findProductById: vi.fn(),
      createProductViewEvent: vi.fn(),
    } as unknown as Mocked<AnalyticsRepository>;

    formatter = new AnalyticsFormatter();
    service = new AnalyticsService(repoMock, formatter);
  });

  describe('getDashboardStats', () => {
    it('should throw BadRequestException if from date is after to date', async () => {
      const from = new Date('2026-08-01');
      const to = new Date('2026-07-01');

      await expect(service.getDashboardStats({ from, to })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should query stats and return formatted totals', async () => {
      repoMock.getDashboardStats.mockResolvedValue({
        ordersCount: 10,
        itemsSold: 50,
        grossSales: 1000,
        netSales: 800,
        taxTotal: 200,
        productViews: 500,
      });

      const stats = await service.getDashboardStats();

      expect(stats.ordersCount).toBe(10);
      expect(stats.itemsSold).toBe(50);
      expect(stats.grossSales).toBe(1000);
    });
  });

  describe('getTopProducts', () => {
    it('should return empty array if no sales exist', async () => {
      repoMock.getTopProductSales.mockResolvedValue([]);

      const topProducts = await service.getTopProducts({}, 5);

      expect(topProducts).toHaveLength(0);
      expect(repoMock.findProductsByIds).not.toHaveBeenCalled();
    });

    it('should aggregate sales, view stats, and product metadata', async () => {
      repoMock.getTopProductSales.mockResolvedValue([
        { productId: 'p1', quantitySold: 20, revenue: 500 },
      ]);
      repoMock.getProductViewsByProduct.mockResolvedValue([
        { productId: 'p1', views: 150 },
      ]);
      repoMock.findProductsByIds.mockResolvedValue([
        { id: 'p1', name: 'Keyboard', reference: 'KB1' } as never,
      ]);

      const top = await service.getTopProducts({}, 10);

      expect(top).toHaveLength(1);
      expect(top[0].productId).toBe('p1');
      expect(top[0].quantitySold).toBe(20);
      expect(top[0].views).toBe(150);
    });
  });

  describe('trackProductView', () => {
    it('should throw NotFoundException if product is invalid', async () => {
      repoMock.findProductById.mockResolvedValue(null);

      await expect(
        service.trackProductView({ productId: 'invalid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should anonymize IPv4 address before recording event', async () => {
      repoMock.findProductById.mockResolvedValue({ id: 'p1' });
      repoMock.createProductViewEvent.mockResolvedValue({
        id: 'event-1',
        productId: 'p1',
        ipAddress: '192.168.1.0',
      } as never);

      await service.trackProductView({
        productId: 'p1',
        ipAddress: '192.168.1.45',
      });

      expect(repoMock.createProductViewEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'p1',
          ipAddress: '192.168.1.0',
        }),
      );
    });
  });
});
