import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PriceCalculationService } from './price-calculation.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { PriceQueryService } from './price-query.service';

// ─── Factories ─────────────────────────────────────────────────────────────

function makePrisma(): Mocked<PrismaService> {
  return {
    product: { findUnique: vi.fn() },
    productCombination: { findUnique: vi.fn() },
    customer: { findUnique: vi.fn() },
    currency: { findUnique: vi.fn() },
    cartRule: { findMany: vi.fn() },
  } as unknown as Mocked<PrismaService>;
}

function makeQuery(): Mocked<PriceQueryService> {
  return {
    findBestSpecificPrice: vi.fn().mockResolvedValue(null),
    getTaxRate: vi.fn().mockResolvedValue(20),
  } as unknown as Mocked<PriceQueryService>;
}

function makeProduct(price: number) {
  return { id: 'p1', price } as never;
}

describe('PriceCalculationService — full suite', () => {
  let service: PriceCalculationService;
  let prisma: Mocked<PrismaService>;
  let priceQuery: Mocked<PriceQueryService>;

  beforeEach(() => {
    prisma = makePrisma();
    priceQuery = makeQuery();
    service = new PriceCalculationService(prisma, priceQuery);
  });

  // ─── Error cases ──────────────────────────────────────────────────────────

  it('should throw when product not found', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(
      service.calculatePrice({ productId: 'missing' }),
    ).rejects.toThrow('not found');
  });

  it('should throw when currency code is invalid', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    priceQuery.findBestSpecificPrice.mockResolvedValue(null);
    prisma.currency.findUnique.mockResolvedValue(null);

    await expect(
      service.calculatePrice({ productId: 'p1', currencyCode: 'XYZ' }),
    ).rejects.toThrow('Currency XYZ not found');
  });

  it('should throw when customer group hides prices (B2B)', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      group: { showPrices: false, reduction: 0 },
    } as never);

    await expect(
      service.calculatePrice({ productId: 'p1', customerId: 'cust1' }),
    ).rejects.toThrow('Prices are hidden');
  });

  // ─── Base price calculation ───────────────────────────────────────────────

  it('should calculate base price + 20% tax with no discounts', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));

    const result = await service.calculatePrice({ productId: 'p1' });
    expect(result.basePrice).toBe(100);
    expect(result.priceHT).toBe(100);
    expect(result.taxRate).toBe(20);
    expect(result.taxAmount).toBe(20);
    expect(result.priceTTC).toBe(120);
    expect(result.combinationImpact).toBe(0);
    expect(result.customerGroupReduction).toBe(0);
    expect(result.specificPriceReduction).toBe(0);
    expect(result.cartRuleReduction).toBe(0);
  });

  // ─── Combination impact ───────────────────────────────────────────────────

  it('should add combination price impact to base price', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.productCombination.findUnique.mockResolvedValue({
      id: 'c1',
      priceImpact: 25,
    } as never);

    const result = await service.calculatePrice({
      productId: 'p1',
      combinationId: 'c1',
    });
    expect(result.basePrice).toBe(100);
    expect(result.combinationImpact).toBe(25);
    expect(result.priceHT).toBe(125);
    expect(result.priceTTC).toBe(150); // 125 * 1.2
  });

  it('should ignore combination impact if combination not found', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.productCombination.findUnique.mockResolvedValue(null);

    const result = await service.calculatePrice({
      productId: 'p1',
      combinationId: 'nonexistent',
    });
    expect(result.combinationImpact).toBe(0);
    expect(result.priceHT).toBe(100);
  });

  // ─── Customer group discount ───────────────────────────────────────────────

  it('should apply customer group percentage reduction', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      group: { showPrices: true, reduction: 10 }, // 10%
    } as never);

    const result = await service.calculatePrice({
      productId: 'p1',
      customerId: 'cust1',
    });
    expect(result.customerGroupReduction).toBe(10); // 10% of 100
    expect(result.priceHT).toBe(90);
    expect(result.priceTTC).toBe(108); // 90 * 1.2
  });

  it('should not apply group discount if customer has no group', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.customer.findUnique.mockResolvedValue({
      id: 'cust1',
      group: null,
    } as never);

    const result = await service.calculatePrice({
      productId: 'p1',
      customerId: 'cust1',
    });
    expect(result.customerGroupReduction).toBe(0);
    expect(result.priceHT).toBe(100);
  });

  // ─── Specific price (date, qty, country) ──────────────────────────────────

  it('should apply percentage-type specific price reduction', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    priceQuery.findBestSpecificPrice.mockResolvedValue({
      reductionType: 'percentage',
      reduction: 15,
    });

    const result = await service.calculatePrice({ productId: 'p1' });
    expect(result.specificPriceReduction).toBe(15); // 15% of 100
    expect(result.priceHT).toBe(85);
    expect(result.priceTTC).toBe(102); // 85 * 1.2
  });

  it('should apply fixed-type specific price reduction', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    priceQuery.findBestSpecificPrice.mockResolvedValue({
      reductionType: 'amount',
      reduction: 20,
    });

    const result = await service.calculatePrice({ productId: 'p1' });
    expect(result.specificPriceReduction).toBe(20);
    expect(result.priceHT).toBe(80);
  });

  it('should not go below 0 on extreme discounts', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(10));
    priceQuery.findBestSpecificPrice.mockResolvedValue({
      reductionType: 'amount',
      reduction: 999,
    });

    const result = await service.calculatePrice({ productId: 'p1' });
    expect(result.priceHT).toBeGreaterThanOrEqual(0);
    expect(result.priceTTC).toBeGreaterThanOrEqual(0);
  });

  // ─── Tax-inclusive calculation ────────────────────────────────────────────

  it('should use tax rate from priceQuery', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(200));
    priceQuery.getTaxRate.mockResolvedValue(10); // 10%

    const result = await service.calculatePrice({ productId: 'p1' });
    expect(result.taxRate).toBe(10);
    expect(result.taxAmount).toBe(20); // 200 * 10%
    expect(result.priceTTC).toBe(220);
  });

  // ─── Tiered pricing (quantity breaks via cartRules) ───────────────────────

  it('should apply cart rule percentage reduction (tiered pricing)', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.cartRule.findMany.mockResolvedValue([
      { reductionType: 'percentage', reduction: 5 },
    ] as never);

    const result = await service.calculatePrice({
      productId: 'p1',
      cartRuleCodes: ['BULK5'],
    });
    expect(result.cartRuleReduction).toBe(5); // 5% of 100
    expect(result.priceHT).toBe(95);
  });

  it('should apply multiple cart rules cumulatively', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.cartRule.findMany.mockResolvedValue([
      { reductionType: 'percentage', reduction: 10 },
      { reductionType: 'amount', reduction: 5 },
    ] as never);

    const result = await service.calculatePrice({
      productId: 'p1',
      cartRuleCodes: ['SAVE10', 'SAVE5'],
    });
    // 10% of 100 = 10, + 5 fixed = 15 total
    expect(result.cartRuleReduction).toBe(15);
    expect(result.priceHT).toBe(85);
  });

  // ─── Multi-currency exchange rate ─────────────────────────────────────────

  it('should multiply price by exchange rate for foreign currency', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(100));
    prisma.currency.findUnique.mockResolvedValue({
      code: 'USD',
      exchangeRate: 1.1,
    } as never);
    priceQuery.getTaxRate.mockResolvedValue(0);

    const result = await service.calculatePrice({
      productId: 'p1',
      currencyCode: 'USD',
    });
    expect(result.basePrice).toBe(110); // 100 * 1.1
    expect(result.priceHT).toBe(110);
    expect(result.priceTTC).toBe(110); // 0% tax
  });

  // ─── Loyalty points ───────────────────────────────────────────────────────

  it('should calculate loyalty points earned (floor priceTTC / 10)', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(95));
    priceQuery.getTaxRate.mockResolvedValue(0);

    const result = await service.calculatePrice({ productId: 'p1' });
    // priceTTC = 95, loyalty = floor(95/10) = 9
    expect(result.loyaltyPointsEarned).toBe(9);
  });

  // ─── Rounding ────────────────────────────────────────────────────────────

  it('should round prices to 2 decimal places', async () => {
    prisma.product.findUnique.mockResolvedValue(makeProduct(33.33));
    priceQuery.getTaxRate.mockResolvedValue(20);

    const result = await service.calculatePrice({ productId: 'p1' });
    expect(result.priceHT).toBe(33.33);
    expect(result.taxAmount).toBe(6.67); // 33.33 * 0.2 = 6.666 → rounds to 6.67
    expect(result.priceTTC).toBe(40); // 33.33 + 6.67
  });
});
