import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PriceCalculationService } from './price-calculation.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { PriceQueryService } from './price-query.service';

describe('PriceCalculationService', () => {
  let service: PriceCalculationService;
  let prisma: Mocked<PrismaService>;
  let priceQuery: Mocked<PriceQueryService>;

  beforeEach(() => {
    prisma = {
      product: { findUnique: vi.fn() },
      productCombination: { findUnique: vi.fn() },
      customer: { findUnique: vi.fn() },
      currency: { findUnique: vi.fn() },
      cartRule: { findMany: vi.fn() },
    } as unknown as Mocked<PrismaService>;

    priceQuery = {
      findBestSpecificPrice: vi.fn(),
      getTaxRate: vi.fn().mockResolvedValue(20),
    } as unknown as Mocked<PriceQueryService>;

    service = new PriceCalculationService(prisma, priceQuery);
  });

  it('should throw error if product not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.calculatePrice({ productId: 'p1' })).rejects.toThrow(
      'Product #p1 not found',
    );
  });

  it('should calculate base price correctly without combination or discount', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      price: 100,
    } as never);
    priceQuery.findBestSpecificPrice.mockResolvedValue(null);

    const result = await service.calculatePrice({ productId: 'p1' });
    expect(result.basePrice).toBe(100);
    expect(result.priceHT).toBe(100);
    expect(result.taxAmount).toBe(20);
    expect(result.priceTTC).toBe(120);
  });

  it('should apply combination price impact', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      price: 100,
    } as never);
    prisma.productCombination.findUnique.mockResolvedValue({
      id: 'c1',
      priceImpact: 15,
    } as never);
    priceQuery.findBestSpecificPrice.mockResolvedValue(null);

    const result = await service.calculatePrice({
      productId: 'p1',
      combinationId: 'c1',
    });
    expect(result.basePrice).toBe(100);
    expect(result.combinationImpact).toBe(15);
    expect(result.priceHT).toBe(115);
  });
});
