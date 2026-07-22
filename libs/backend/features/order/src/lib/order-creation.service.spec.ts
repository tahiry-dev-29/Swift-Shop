import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { OrderCreationService } from './order-creation.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartService } from '@swift-shop/backend/cart';
import { GuestCheckoutService } from './guest-checkout.service';
import { OrderAddressSnapshotService } from './order-address-snapshot.service';
import { BadRequestException } from '@nestjs/common';

// ─── Factories ─────────────────────────────────────────────────────────────

function makePrisma(): Mocked<PrismaService> {
  return {
    order: { findUnique: vi.fn(), create: vi.fn() },
    orderState: { findUnique: vi.fn(), create: vi.fn() },
    orderAddress: { create: vi.fn() },
    orderItem: { create: vi.fn() },
    stock: { updateMany: vi.fn() },
    cartItem: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  } as unknown as Mocked<PrismaService>;
}

function makeCartService(): Mocked<CartService> {
  return {
    getCartWithTotals: vi.fn(),
    reserveStock: vi.fn().mockResolvedValue(undefined),
    releaseReservedStock: vi.fn().mockResolvedValue(undefined),
    clearCart: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<CartService>;
}

function makeGuestCheckoutService(): Mocked<GuestCheckoutService> {
  return {} as unknown as Mocked<GuestCheckoutService>;
}

function makeOrderAddressService(): Mocked<OrderAddressSnapshotService> {
  return {
    getDeliveryAddresses: vi.fn(),
    getBillingAddress: vi.fn(),
    toOrderAddressSnapshot: vi.fn().mockReturnValue({
      firstName: 'John',
      lastName: 'Doe',
      address: '1 Rue Test',
      city: 'Paris',
      zip: '75001',
      countryId: 'FR',
    }),
  } as unknown as Mocked<OrderAddressSnapshotService>;
}

// ─── Cart item helper ────────────────────────────────────────────────────────
// The service reads: item.product.price, item.product.name, item.product.id,
// item.product.stock, item.combination, item.priceDetail, item.combinationId, item.quantity

function makeCartItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item1',
    productId: 'p1',
    combinationId: null,
    quantity: 1,
    priceDetail: null,
    combination: null,
    product: {
      id: 'p1',
      name: 'Widget',
      price: 100,
      stock: { id: 'stock1', quantity: 10, outOfStockBehavior: 'deny' },
    },
    ...overrides,
  };
}

function makeCart(customerId = 'cust1', items = [makeCartItem()]) {
  return {
    id: 'cart1',
    customerId,
    items,
    totalHT: 100,
    totalTTC: 120,
    totalTax: 20,
    discountTotal: 0,
  } as never;
}

// ─── Addresses ───────────────────────────────────────────────────────────────
const DELIVERY_ADDR = {
  id: 'addr1',
  type: 'DELIVERY',
  firstName: 'John',
  city: 'Paris',
};
const BILLING_ADDR = {
  id: 'addr2',
  type: 'BILLING',
  firstName: 'John',
  city: 'Paris',
};

// ─── Transaction factory ─────────────────────────────────────────────────────
function makeTxSuccess(order = { id: 'order-new' }) {
  return vi.fn(async (cb: (tx: unknown) => unknown) => {
    const tx = {
      order: { create: vi.fn().mockResolvedValue(order) },
      orderAddress: { create: vi.fn() },
      orderItem: { create: vi.fn() },
      stock: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      cartItem: { deleteMany: vi.fn() },
    };
    return cb(tx);
  });
}

// ─────────────────────────────────────────────────────────────────────────────

describe('OrderCreationService — full suite', () => {
  let service: OrderCreationService;
  let prisma: Mocked<PrismaService>;
  let cartService: Mocked<CartService>;
  let guestCheckoutService: Mocked<GuestCheckoutService>;
  let orderAddressService: Mocked<OrderAddressSnapshotService>;

  beforeEach(() => {
    prisma = makePrisma();
    cartService = makeCartService();
    guestCheckoutService = makeGuestCheckoutService();
    orderAddressService = makeOrderAddressService();

    service = new OrderCreationService(
      prisma,
      cartService,
      guestCheckoutService,
      orderAddressService,
    );
  });

  // ─── Idempotency ──────────────────────────────────────────────────────────

  describe('idempotency key', () => {
    it('should return existing order when idempotency key matches', async () => {
      const existing = { id: 'order1', idempotencyKey: 'key1' } as never;
      prisma.order.findUnique.mockResolvedValue(existing);

      const result = await service.createOrderFromCart(
        'cart1',
        'cust1',
        'addr1',
        'addr2',
        'key1',
      );
      expect(result).toBe(existing);
      expect(cartService.getCartWithTotals).not.toHaveBeenCalled();
    });
  });

  // ─── Cart validation ──────────────────────────────────────────────────────

  describe('cart validation', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null);
    });

    it('should throw BadRequestException when cart is empty', async () => {
      cartService.getCartWithTotals.mockResolvedValue(makeCart('cust1', []));

      await expect(
        service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cart belongs to different customer', async () => {
      cartService.getCartWithTotals.mockResolvedValue(makeCart('cust2'));

      await expect(
        service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Address validation ───────────────────────────────────────────────────
  // The service uses deliveryAddressList[0] as fallback billing — the list itself
  // drives validation. An empty list means "not found" via the billing fallback path.

  describe('address validation', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null);
      cartService.getCartWithTotals.mockResolvedValue(makeCart());
      // reserveStock is called before address lookup
    });

    it('should throw when getDeliveryAddresses returns empty list (address not found)', async () => {
      // Empty list → getBillingAddress receives undefined → throws BadRequestException
      orderAddressService.getDeliveryAddresses.mockResolvedValue([] as never);
      orderAddressService.getBillingAddress.mockRejectedValue(
        new BadRequestException('Billing address not found'),
      );

      await expect(
        service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw when getBillingAddress cannot find billing address', async () => {
      orderAddressService.getDeliveryAddresses.mockResolvedValue([
        DELIVERY_ADDR,
      ] as never);
      orderAddressService.getBillingAddress.mockRejectedValue(
        new BadRequestException('Billing address not found'),
      );

      await expect(
        service.createOrderFromCart(
          'cart1',
          'cust1',
          'addr1',
          'missing-billing',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Successful order creation ────────────────────────────────────────────

  describe('successful creation', () => {
    beforeEach(() => {
      prisma.order.findUnique.mockResolvedValue(null);
      cartService.getCartWithTotals.mockResolvedValue(makeCart());
      orderAddressService.getDeliveryAddresses.mockResolvedValue([
        DELIVERY_ADDR,
      ] as never);
      orderAddressService.getBillingAddress.mockResolvedValue(
        BILLING_ADDR as never,
      );
    });

    it('should create PENDING order and return the new order', async () => {
      const pendingState = { id: 'state-pending', name: 'PENDING' } as never;
      const newOrder = { id: 'order-new', state: pendingState } as never;

      prisma.orderState.findUnique.mockResolvedValue(pendingState);
      prisma.$transaction.mockImplementation(makeTxSuccess(newOrder));

      const result = await service.createOrderFromCart(
        'cart1',
        'cust1',
        'addr1',
        'addr2',
        'key-new',
      );
      expect(result).toBe(newOrder);
    });

    it('should auto-create PENDING state if it does not exist', async () => {
      const createdState = { id: 'state-new', name: 'PENDING' } as never;
      const newOrder = { id: 'order-new', state: createdState } as never;

      prisma.orderState.findUnique.mockResolvedValue(null);
      prisma.orderState.create.mockResolvedValue(createdState);
      prisma.$transaction.mockImplementation(makeTxSuccess(newOrder));

      await service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2');
      expect(prisma.orderState.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'PENDING' }),
        }),
      );
    });

    it('should decrement stock for each order item inside transaction', async () => {
      const items = [
        makeCartItem({ id: 'item1', productId: 'p1', quantity: 3 }),
        makeCartItem({
          id: 'item2',
          productId: 'p2',
          quantity: 1,
          product: {
            id: 'p2',
            name: 'Gadget',
            price: 50,
            stock: { id: 'stock2', quantity: 5, outOfStockBehavior: 'deny' },
          },
        }),
      ];
      cartService.getCartWithTotals.mockResolvedValue(makeCart('cust1', items));

      const pendingState = { id: 'sp', name: 'PENDING' } as never;
      const newOrder = { id: 'order-new', state: pendingState } as never;
      prisma.orderState.findUnique.mockResolvedValue(pendingState);

      const txStockUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
      prisma.$transaction.mockImplementation(
        async (cb: (tx: unknown) => unknown) => {
          const tx = {
            order: { create: vi.fn().mockResolvedValue(newOrder) },
            orderAddress: { create: vi.fn() },
            orderItem: { create: vi.fn() },
            stock: { updateMany: txStockUpdateMany },
            cartItem: { deleteMany: vi.fn() },
          };
          return cb(tx);
        },
      );

      await service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2');
      // Two items → two stock decrements
      expect(txStockUpdateMany).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException when stock is insufficient inside transaction', async () => {
      const pendingState = { id: 'sp', name: 'PENDING' } as never;
      prisma.orderState.findUnique.mockResolvedValue(pendingState);
      prisma.$transaction.mockImplementation(
        async (cb: (tx: unknown) => unknown) => {
          const tx = {
            order: { create: vi.fn().mockResolvedValue({ id: 'o1' }) },
            orderAddress: { create: vi.fn() },
            orderItem: { create: vi.fn() },
            stock: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) }, // 0 = insufficient
            cartItem: { deleteMany: vi.fn() },
          };
          return cb(tx);
        },
      );

      await expect(
        service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should release reserved stock in finally block after success', async () => {
      const pendingState = { id: 'sp', name: 'PENDING' } as never;
      const newOrder = { id: 'order-new', state: pendingState } as never;
      prisma.orderState.findUnique.mockResolvedValue(pendingState);
      prisma.$transaction.mockImplementation(makeTxSuccess(newOrder));

      await service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2');
      expect(cartService.releaseReservedStock).toHaveBeenCalledWith('cart1');
    });

    it('should release reserved stock even when transaction throws', async () => {
      const pendingState = { id: 'sp', name: 'PENDING' } as never;
      prisma.orderState.findUnique.mockResolvedValue(pendingState);
      prisma.$transaction.mockRejectedValue(new Error('DB failure'));

      await expect(
        service.createOrderFromCart('cart1', 'cust1', 'addr1', 'addr2'),
      ).rejects.toThrow('DB failure');

      // releaseReservedStock must still be called (finally block)
      expect(cartService.releaseReservedStock).toHaveBeenCalledWith('cart1');
    });
  });

  // ─── Guest checkout ───────────────────────────────────────────────────────

  describe('guest checkout (customerId mismatch)', () => {
    it('should throw BadRequestException when cart belongs to a different customer', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      cartService.getCartWithTotals.mockResolvedValue(makeCart('other-cust'));

      await expect(
        service.createOrderFromCart('cart1', 'guest-cust', 'addr1', 'addr2'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
