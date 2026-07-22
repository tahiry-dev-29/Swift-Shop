import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsRepository } from './analytics.repository';
import { PrismaService } from '@swift-shop/data-access-prisma';

describe('AnalyticsRepository Raw Query Tests', () => {
  let repository: AnalyticsRepository;
  let prismaMock: {
    $queryRaw: ReturnType<typeof vi.fn>;
    productViewEvent: {
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    product: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      $queryRaw: vi.fn(),
      productViewEvent: {
        count: vi.fn(),
        create: vi.fn(),
      },
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    repository = new AnalyticsRepository(
      prismaMock as unknown as PrismaService,
    );
  });

  it('getDashboardStats — executes $queryRaw and returns formatted stats', async () => {
    prismaMock.$queryRaw.mockResolvedValue([
      {
        ordersCount: 15,
        itemsSold: 42,
        grossSales: 1500,
        netSales: 1200,
        taxTotal: 300,
        productViews: 0,
      },
    ]);
    prismaMock.productViewEvent.count.mockResolvedValue(250);

    const res = await repository.getDashboardStats({
      from: new Date('2026-07-01'),
      to: new Date('2026-07-22'),
    });

    expect(res.ordersCount).toBe(15);
    expect(res.productViews).toBe(250);
  });

  it('createProductViewEvent — inserts view event record into database', async () => {
    const input = { productId: 'p1', ipAddress: '10.0.0.0' };
    prismaMock.productViewEvent.create.mockResolvedValue({
      id: 'pv-1',
      ...input,
    } as never);

    const event = await repository.createProductViewEvent(input);

    expect(prismaMock.productViewEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ productId: 'p1' }),
    });
    expect(event.id).toBe('pv-1');
  });
});
