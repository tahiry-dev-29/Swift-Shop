import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { OrderCreationService } from './order-creation.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartService } from '@swift-shop/backend/cart';
import { GuestCheckoutService } from './guest-checkout.service';
import { OrderAddressSnapshotService } from './order-address-snapshot.service';
import { BadRequestException } from '@nestjs/common';

describe('OrderCreationService', () => {
  let service: OrderCreationService;
  let prisma: Mocked<PrismaService>;
  let cartService: Mocked<CartService>;
  let guestCheckoutService: Mocked<GuestCheckoutService>;
  let orderAddressService: Mocked<OrderAddressSnapshotService>;

  beforeEach(() => {
    prisma = {
      order: { findUnique: vi.fn(), create: vi.fn() },
      orderState: { findUnique: vi.fn(), create: vi.fn() },
      orderAddress: { create: vi.fn() },
      orderItem: { create: vi.fn() },
      $transaction: vi.fn((cb) => cb(prisma)),
    } as unknown as Mocked<PrismaService>;

    cartService = {
      getCartWithTotals: vi.fn(),
      reserveStock: vi.fn(),
      clearCart: vi.fn(),
    } as unknown as Mocked<CartService>;

    guestCheckoutService = {} as unknown as Mocked<GuestCheckoutService>;

    orderAddressService = {
      getDeliveryAddresses: vi.fn(),
      getBillingAddress: vi.fn(),
      toOrderAddressSnapshot: vi.fn(),
    } as unknown as Mocked<OrderAddressSnapshotService>;

    service = new OrderCreationService(
      prisma,
      cartService,
      guestCheckoutService,
      orderAddressService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrderFromCart', () => {
    it('should return existing order if idempotency key matches', async () => {
      const mockOrder = { id: 'order1', idempotencyKey: 'key1' } as never;
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.createOrderFromCart(
        'cart1',
        'cust1',
        'addr1',
        'addr2',
        'key1',
      );
      expect(result).toBe(mockOrder);
      expect(cartService.getCartWithTotals).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if cart is empty', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      cartService.getCartWithTotals.mockResolvedValue({ items: [] } as never);

      await expect(
        service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2', 'key1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if cart customerId does not match customer', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      cartService.getCartWithTotals.mockResolvedValue({
        items: [{ id: 'item1' }],
        customerId: 'cust2',
      } as never);

      await expect(
        service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2', 'key1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
