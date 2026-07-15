import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CartService } from './cart-service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartMergeService } from './cart-merge.service';
import { CartPricingService } from './cart-pricing.service';
import { CartCouponService } from './cart-coupon.service';
import { CartStockReservationService } from './cart-stock-reservation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let prisma: Mocked<PrismaService>;
  let cartMergeService: Mocked<CartMergeService>;
  let cartPricingService: Mocked<CartPricingService>;
  let cartCouponService: Mocked<CartCouponService>;
  let cartStockReservationService: Mocked<CartStockReservationService>;

  beforeEach(() => {
    prisma = {
      cart: { findFirst: vi.fn(), create: vi.fn() },
      product: { findUnique: vi.fn() },
      cartItem: {
        updateMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    } as unknown as Mocked<PrismaService>;

    cartMergeService = {} as unknown as Mocked<CartMergeService>;
    cartPricingService = {} as unknown as Mocked<CartPricingService>;
    cartCouponService = {} as unknown as Mocked<CartCouponService>;
    cartStockReservationService =
      {} as unknown as Mocked<CartStockReservationService>;

    service = new CartService(
      prisma,
      cartMergeService,
      cartPricingService,
      cartCouponService,
      cartStockReservationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('should throw BadRequestException if customerId and sessionId are missing', async () => {
      await expect(
        service.getOrCreateCart(undefined, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing cart if it exists', async () => {
      const mockCart = { id: 'cart1', customerId: 'cust1' } as never;
      prisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart('cust1');
      expect(result).toBe(mockCart);
      expect(prisma.cart.create).not.toHaveBeenCalled();
    });
  });

  describe('addToCart', () => {
    it('should throw NotFoundException if product is not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.addToCart('cart1', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
