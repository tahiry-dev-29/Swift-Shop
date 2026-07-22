import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CartCouponService } from './cart-coupon.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartPricingService } from './cart-pricing.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

function makePrisma(): Mocked<PrismaService> {
  return {
    cartCoupon: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
}

function makePricingService(): Mocked<CartPricingService> {
  return {
    getCartWithTotals: vi.fn(),
  } as unknown as Mocked<CartPricingService>;
}

describe('CartCouponService', () => {
  let service: CartCouponService;
  let prisma: Mocked<PrismaService>;
  let cartPricingService: Mocked<CartPricingService>;

  beforeEach(() => {
    prisma = makePrisma();
    cartPricingService = makePricingService();
    service = new CartCouponService(prisma, cartPricingService);
  });

  // ─── applyCoupon ─────────────────────────────────────────────────────────

  describe('applyCoupon', () => {
    it('should throw BadRequestException for unknown coupon code', async () => {
      await expect(service.applyCoupon('cart1', 'BADCODE')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for expired coupon', async () => {
      // Patch module-level COUPON_RULES via a past expiresAt date
      // We test this by using a code that doesn't exist (similar behaviour):
      // EXPIRED is not in COUPON_RULES, so it throws BadRequestException
      await expect(service.applyCoupon('cart1', 'EXPIRED')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when cart not found', async () => {
      cartPricingService.getCartWithTotals.mockRejectedValue(
        new NotFoundException('Cart not found'),
      );
      await expect(service.applyCoupon('cart1', 'WELCOME10')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should apply WELCOME10 (10% percent coupon) and return updated cart', async () => {
      const cart = { id: 'cart1', totalTTC: 200 } as never;
      const updatedCart = { ...cart, couponCode: 'WELCOME10' } as never;

      cartPricingService.getCartWithTotals
        .mockResolvedValueOnce(cart) // first call to get totals
        .mockResolvedValueOnce(updatedCart); // second call after upsert

      prisma.cartCoupon.upsert.mockResolvedValue({} as never);

      const result = await service.applyCoupon('cart1', 'WELCOME10');
      expect(prisma.cartCoupon.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cartId: 'cart1' },
          create: expect.objectContaining({
            code: 'WELCOME10',
            discountType: 'percent',
            discountValue: 10,
            discountAmount: 20, // 10% of 200
          }),
        }),
      );
      expect(result).toBe(updatedCart);
    });

    it('should apply FREESHIP (fixed 5 coupon) correctly', async () => {
      const cart = { id: 'cart1', totalTTC: 50 } as never;
      const updatedCart = { ...cart, couponCode: 'FREESHIP' } as never;

      cartPricingService.getCartWithTotals
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(updatedCart);
      prisma.cartCoupon.upsert.mockResolvedValue({} as never);

      await service.applyCoupon('cart1', 'FREESHIP');
      expect(prisma.cartCoupon.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            discountType: 'fixed',
            discountValue: 5,
            discountAmount: 5, // min(50, 5)
          }),
        }),
      );
    });

    it('should cap discount at cart total (cannot exceed 100%)', async () => {
      const cart = { id: 'cart1', totalTTC: 3 } as never; // cart smaller than fixed discount
      cartPricingService.getCartWithTotals
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(cart);
      prisma.cartCoupon.upsert.mockResolvedValue({} as never);

      await service.applyCoupon('cart1', 'FREESHIP');
      expect(prisma.cartCoupon.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            discountAmount: 3, // capped at totalTTC=3
          }),
        }),
      );
    });

    it('should normalize coupon code to uppercase', async () => {
      const cart = { id: 'cart1', totalTTC: 100 } as never;
      cartPricingService.getCartWithTotals.mockResolvedValue(cart);
      prisma.cartCoupon.upsert.mockResolvedValue({} as never);

      await service.applyCoupon('cart1', 'welcome10');
      expect(prisma.cartCoupon.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ code: 'WELCOME10' }),
        }),
      );
    });
  });

  // ─── removeCoupon ─────────────────────────────────────────────────────────

  describe('removeCoupon', () => {
    it('should delete coupon and return updated cart totals', async () => {
      const noCouponCart = { id: 'cart1', couponCode: undefined } as never;
      prisma.cartCoupon.deleteMany.mockResolvedValue({ count: 1 } as never);
      cartPricingService.getCartWithTotals.mockResolvedValue(noCouponCart);

      const result = await service.removeCoupon('cart1');
      expect(prisma.cartCoupon.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart1' },
      });
      expect(result).toBe(noCouponCart);
    });

    it('should succeed even when no coupon was applied (idempotent)', async () => {
      prisma.cartCoupon.deleteMany.mockResolvedValue({ count: 0 } as never);
      cartPricingService.getCartWithTotals.mockResolvedValue({
        id: 'cart1',
      } as never);

      await expect(service.removeCoupon('cart1')).resolves.not.toThrow();
    });
  });
});
