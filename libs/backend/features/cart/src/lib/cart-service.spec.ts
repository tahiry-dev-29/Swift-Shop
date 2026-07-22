import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CartService } from './cart-service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartMergeService } from './cart-merge.service';
import { CartPricingService } from './cart-pricing.service';
import { CartCouponService } from './cart-coupon.service';
import { CartStockReservationService } from './cart-stock-reservation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ─── Factories ─────────────────────────────────────────────────────────────

function makePrisma(): Mocked<PrismaService> {
  return {
    cart: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    product: { findUnique: vi.fn() },
    cartItem: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
}

function makeProduct(overrides = {}) {
  return {
    id: 'p1',
    active: true,
    combinations: [],
    stock: null,
    ...overrides,
  } as never;
}

describe('CartService — full suite', () => {
  let service: CartService;
  let prisma: Mocked<PrismaService>;
  let cartMergeService: Mocked<CartMergeService>;
  let cartPricingService: Mocked<CartPricingService>;
  let cartCouponService: Mocked<CartCouponService>;
  let cartStockReservationService: Mocked<CartStockReservationService>;

  beforeEach(() => {
    prisma = makePrisma();
    cartMergeService = {
      mergeGuestCart: vi.fn(),
    } as unknown as Mocked<CartMergeService>;
    cartPricingService = {
      getCartWithTotals: vi.fn(),
    } as unknown as Mocked<CartPricingService>;
    cartCouponService = {
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
    } as unknown as Mocked<CartCouponService>;
    cartStockReservationService = {
      reserveCartStock: vi.fn(),
      releaseCartStock: vi.fn(),
    } as unknown as Mocked<CartStockReservationService>;

    service = new CartService(
      prisma,
      cartMergeService,
      cartPricingService,
      cartCouponService,
      cartStockReservationService,
    );
  });

  // ─── getOrCreateCart ──────────────────────────────────────────────────────

  describe('getOrCreateCart', () => {
    it('should throw BadRequestException if neither customerId nor sessionId given', async () => {
      await expect(service.getOrCreateCart()).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return existing cart for customer without creating a new one', async () => {
      const mockCart = { id: 'cart1', customerId: 'cust1' } as never;
      prisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart('cust1');
      expect(result).toBe(mockCart);
      expect(prisma.cart.create).not.toHaveBeenCalled();
    });

    it('should create and return new cart when none exists for customer', async () => {
      const newCart = { id: 'cart-new', customerId: 'cust1' } as never;
      prisma.cart.findFirst.mockResolvedValue(null);
      prisma.cart.create.mockResolvedValue(newCart);

      const result = await service.getOrCreateCart('cust1');
      expect(result).toBe(newCart);
      expect(prisma.cart.create).toHaveBeenCalled();
    });

    it('should find/create cart by sessionId for guest users', async () => {
      const guestCart = { id: 'cart-guest', sessionId: 'sess1' } as never;
      prisma.cart.findFirst.mockResolvedValue(null);
      prisma.cart.create.mockResolvedValue(guestCart);

      const result = await service.getOrCreateCart(undefined, 'sess1');
      expect(result).toBe(guestCart);
      expect(prisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { sessionId: 'sess1' } }),
      );
    });
  });

  // ─── addToCart ───────────────────────────────────────────────────────────

  describe('addToCart', () => {
    it('should throw NotFoundException when product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.addToCart('cart1', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when product is inactive', async () => {
      prisma.product.findUnique.mockResolvedValue(
        makeProduct({ active: false }),
      );
      await expect(service.addToCart('cart1', 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when product has combinations and none selected', async () => {
      prisma.product.findUnique.mockResolvedValue(
        makeProduct({ combinations: [{ id: 'comb1', stock: null }] }),
      );
      await expect(service.addToCart('cart1', 'p1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when selected combinationId does not exist on product', async () => {
      prisma.product.findUnique.mockResolvedValue(
        makeProduct({ combinations: [{ id: 'comb1', stock: null }] }),
      );
      await expect(
        service.addToCart('cart1', 'p1', 1, 'wrong-comb'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      prisma.product.findUnique.mockResolvedValue(
        makeProduct({
          stock: { outOfStockBehavior: 'deny', quantity: 2 },
        }),
      );
      prisma.cartItem.updateMany.mockResolvedValue({ count: 0 } as never);
      prisma.cartItem.findFirst.mockResolvedValue(null);
      await expect(service.addToCart('cart1', 'p1', 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should increment quantity for existing cart item', async () => {
      const existingItem = { id: 'item1', quantity: 2 } as never;
      prisma.product.findUnique.mockResolvedValue(makeProduct());
      prisma.cartItem.updateMany.mockResolvedValue({ count: 1 } as never);
      prisma.cartItem.findFirst.mockResolvedValue(existingItem);

      const result = await service.addToCart('cart1', 'p1', 1);
      expect(result).toBe(existingItem);
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });

    it('should create new cart item when item does not yet exist', async () => {
      const newItem = { id: 'item-new', quantity: 1 } as never;
      prisma.product.findUnique.mockResolvedValue(makeProduct());
      prisma.cartItem.updateMany.mockResolvedValue({ count: 0 } as never);
      prisma.cartItem.create.mockResolvedValue(newItem);

      const result = await service.addToCart('cart1', 'p1', 1);
      expect(result).toBe(newItem);
      expect(prisma.cartItem.create).toHaveBeenCalled();
    });
  });

  // ─── updateCartItemQuantity ───────────────────────────────────────────────

  describe('updateCartItemQuantity', () => {
    it('should throw BadRequestException when quantity is less than 1', async () => {
      await expect(service.updateCartItemQuantity('item1', 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when cart item does not exist', async () => {
      prisma.cartItem.findUnique.mockResolvedValue(null);
      await expect(service.updateCartItemQuantity('item1', 2)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when requested qty exceeds available stock', async () => {
      prisma.cartItem.findUnique.mockResolvedValue({
        id: 'item1',
        product: { stock: { outOfStockBehavior: 'deny', quantity: 3 } },
        combination: null,
      } as never);

      await expect(service.updateCartItemQuantity('item1', 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update and return the cart item on valid quantity', async () => {
      const updated = { id: 'item1', quantity: 5 } as never;
      prisma.cartItem.findUnique.mockResolvedValue({
        id: 'item1',
        product: { stock: { outOfStockBehavior: 'allow', quantity: 100 } },
        combination: null,
      } as never);
      prisma.cartItem.update.mockResolvedValue(updated);

      const result = await service.updateCartItemQuantity('item1', 5);
      expect(result).toBe(updated);
    });
  });

  // ─── removeCartItem ───────────────────────────────────────────────────────

  describe('removeCartItem', () => {
    it('should throw NotFoundException when item does not exist in cart', async () => {
      prisma.cartItem.findUnique.mockResolvedValue(null);
      await expect(service.removeCartItem('item-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete and return the removed item', async () => {
      const item = { id: 'item1', productId: 'p1' } as never;
      prisma.cartItem.findUnique.mockResolvedValue(item);
      prisma.cartItem.delete.mockResolvedValue(item);

      const result = await service.removeCartItem('item1');
      expect(result).toBe(item);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'item1' } }),
      );
    });
  });

  // ─── clearCart ────────────────────────────────────────────────────────────

  describe('clearCart', () => {
    it('should delete all cart items and return the empty cart', async () => {
      const emptyCart = { id: 'cart1', items: [] } as never;
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 3 } as never);
      prisma.cart.findUnique.mockResolvedValue(emptyCart);

      const result = await service.clearCart('cart1');
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart1' },
      });
      expect(result).toBe(emptyCart);
    });

    it('should succeed even when cart is already empty', async () => {
      const emptyCart = { id: 'cart1', items: [] } as never;
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 0 } as never);
      prisma.cart.findUnique.mockResolvedValue(emptyCart);

      await expect(service.clearCart('cart1')).resolves.not.toThrow();
    });
  });

  // ─── delegate: getCartWithTotals ──────────────────────────────────────────

  describe('getCartWithTotals', () => {
    it('should delegate to CartPricingService', async () => {
      const totals = { id: 'cart1', totalTTC: 100 } as never;
      cartPricingService.getCartWithTotals.mockResolvedValue(totals);

      const result = await service.getCartWithTotals('cart1');
      expect(cartPricingService.getCartWithTotals).toHaveBeenCalledWith(
        'cart1',
        undefined,
      );
      expect(result).toBe(totals);
    });
  });

  // ─── delegate: mergeGuestCart ─────────────────────────────────────────────

  describe('mergeGuestCart', () => {
    it('should delegate to CartMergeService', async () => {
      const merged = { id: 'cart1' } as never;
      cartMergeService.mergeGuestCart.mockResolvedValue(merged);

      const result = await service.mergeGuestCart('sess1', 'cust1');
      expect(cartMergeService.mergeGuestCart).toHaveBeenCalledWith(
        'sess1',
        'cust1',
      );
      expect(result).toBe(merged);
    });
  });

  // ─── delegate: applyCoupon / removeCoupon ─────────────────────────────────

  describe('applyCoupon', () => {
    it('should delegate to CartCouponService', async () => {
      const withCoupon = { id: 'cart1', couponCode: 'WELCOME10' } as never;
      cartCouponService.applyCoupon.mockResolvedValue(withCoupon);

      const result = await service.applyCoupon('cart1', 'WELCOME10');
      expect(result).toBe(withCoupon);
    });
  });

  describe('removeCoupon', () => {
    it('should delegate to CartCouponService', async () => {
      const noCoupon = { id: 'cart1', couponCode: undefined } as never;
      cartCouponService.removeCoupon.mockResolvedValue(noCoupon);

      const result = await service.removeCoupon('cart1');
      expect(result).toBe(noCoupon);
    });
  });
});
