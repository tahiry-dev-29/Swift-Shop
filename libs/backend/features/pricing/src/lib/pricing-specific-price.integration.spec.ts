import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PricingResolver } from './pricing.resolver';
import { PrismaService } from '@swift-shop/data-access-prisma';

describe('PricingResolver - specificPrices CRUD', () => {
  let resolver: PricingResolver;
  let prisma: Mocked<PrismaService>;

  const mockSpecificPrice = {
    id: 'sp-1',
    productId: 'prod-1',
    reduction: 10,
    reductionType: 'AMOUNT',
    active: true,
    priority: 1,
  };

  beforeEach(() => {
    prisma = {
      specificPrice: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as any;
    const mockPriceCalcSvc = {
      calculatePrice: vi.fn(),
    };

    resolver = new PricingResolver(mockPriceCalcSvc as any, prisma);
  });

  it('should list specific prices filtered by product or customer', async () => {
    prisma.specificPrice.findMany.mockResolvedValue([mockSpecificPrice] as any);

    const result = await resolver.specificPrices('prod-1', undefined);
    expect(prisma.specificPrice.findMany).toHaveBeenCalledWith({
      where: { active: true, productId: 'prod-1' },
      orderBy: { priority: 'desc' },
    });
    expect(result).toEqual([mockSpecificPrice]);
  });

  it('should create a specific price discount rule', async () => {
    prisma.specificPrice.create.mockResolvedValue(mockSpecificPrice as any);
    const input = {
      productId: 'prod-1',
      reduction: 10,
      reductionType: 'AMOUNT',
    };

    const result = await resolver.createSpecificPrice(input as any);
    expect(prisma.specificPrice.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(mockSpecificPrice);
  });

  it('should update a specific price discount rule', async () => {
    const updated = { ...mockSpecificPrice, reduction: 20 };
    prisma.specificPrice.update.mockResolvedValue(updated as any);
    const input = { reduction: 20 };

    const result = await resolver.updateSpecificPrice('sp-1', input as any);
    expect(prisma.specificPrice.update).toHaveBeenCalledWith({
      where: { id: 'sp-1' },
      data: input,
    });
    expect(result.reduction).toBe(20);
  });

  it('should delete a specific price rule', async () => {
    prisma.specificPrice.delete.mockResolvedValue(mockSpecificPrice as any);

    const result = await resolver.deleteSpecificPrice('sp-1');
    expect(prisma.specificPrice.delete).toHaveBeenCalledWith({
      where: { id: 'sp-1' },
    });
    expect(result).toEqual(mockSpecificPrice);
  });
});
