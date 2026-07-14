import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { OrderCreationService } from './order-creation.service';
import { OrderActionService } from './order-action.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { CartService } from '@swift-shop/backend/cart';
import { GuestCheckoutService } from './guest-checkout.service';
import { OrderAddressSnapshotService } from './order-address-snapshot.service';
import { PubSub } from 'graphql-subscriptions';
import { BadRequestException } from '@nestjs/common';

/**
 * Integration test: createOrder flow from cart → order → cancel.
 * Tests the full service chain with mocked data layer.
 */
describe('Order — createOrder integration flow', () => {
  let creationService: OrderCreationService;
  let actionService: OrderActionService;
  let prisma: Mocked<PrismaService>;
  let cartService: Mocked<CartService>;
  let orderAddressService: Mocked<OrderAddressSnapshotService>;

  beforeEach(() => {
    prisma = {
      order: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
      orderState: { findUnique: vi.fn(), create: vi.fn() },
      orderAddress: { create: vi.fn() },
      orderItem: { create: vi.fn() },
      orderHistory: { create: vi.fn() },
      cartItem: { deleteMany: vi.fn() },
      product: { findUnique: vi.fn() },
      stock: { update: vi.fn(), updateMany: vi.fn() },
      $transaction: vi.fn((cb) => cb(prisma)),
    } as unknown as Mocked<PrismaService>;

    cartService = {
      getCartWithTotals: vi.fn(),
      reserveStock: vi.fn(),
      releaseReservedStock: vi.fn(),
      clearCart: vi.fn(),
    } as unknown as Mocked<CartService>;

    orderAddressService = {
      getDeliveryAddresses: vi.fn(),
      getBillingAddress: vi.fn(),
      toOrderAddressSnapshot: vi.fn().mockReturnValue({
        firstname: 'John',
        lastname: 'Doe',
        address1: '123 Test St',
        city: 'Paris',
        postcode: '75001',
        country: 'FR',
      }),
    } as unknown as Mocked<OrderAddressSnapshotService>;

    const guestCheckoutService = {} as unknown as Mocked<GuestCheckoutService>;

    creationService = new OrderCreationService(
      prisma,
      cartService,
      guestCheckoutService,
      orderAddressService,
    );

    const pubSub = { publish: vi.fn() } as unknown as Mocked<PubSub>;
    actionService = new OrderActionService(prisma, pubSub);
  });

  it('should create an order from cart → then cancel it', async () => {
    // STEP 1: createOrderFromCart
    const mockCart = {
      items: [
        {
          productId: 'p1',
          combinationId: null,
          quantity: 2,
          product: { id: 'p1', name: 'T-Shirt', price: 25 },
          combination: null,
          priceDetail: {
            priceHT: 25,
            priceTTC: 30,
            taxRate: 20,
          },
        },
      ],
      customerId: 'cust1',
      totalHT: 50,
      totalTax: 10,
      totalTTC: 60,
      discountTotal: 0,
    } as never;

    const mockState = { id: 'state1', name: 'PENDING' } as never;
    const mockOrder = {
      id: 'order1',
      reference: 'DO-20260714-ABC12345',
      stateId: 'state1',
      state: { name: 'PENDING' },
    } as never;
    const mockDeliveryAddr = {
      id: 'addr1',
      firstname: 'John',
      lastname: 'Doe',
    } as never;

    prisma.order.findUnique.mockResolvedValue(null);
    cartService.getCartWithTotals.mockResolvedValue(mockCart);
    cartService.reserveStock.mockResolvedValue(undefined);
    cartService.releaseReservedStock.mockResolvedValue(undefined);
    orderAddressService.getDeliveryAddresses.mockResolvedValue([
      mockDeliveryAddr,
    ]);
    orderAddressService.getBillingAddress.mockResolvedValue(mockDeliveryAddr);
    prisma.orderState.findUnique.mockResolvedValue(mockState);
    prisma.order.create.mockResolvedValue(mockOrder);
    prisma.orderAddress.create.mockResolvedValue({} as never);
    prisma.orderItem.create.mockResolvedValue({} as never);
    prisma.stock.updateMany.mockResolvedValue({ count: 1 } as never);
    prisma.cartItem.deleteMany.mockResolvedValue({} as never);

    const order = await creationService.createOrderFromCart(
      'cart1',
      'cust1',
      'addr1',
      'addr2',
      'idem-1',
    );

    expect(order).toBe(mockOrder);
    expect(cartService.reserveStock).toHaveBeenCalledWith('cart1');
    expect(prisma.orderItem.create).toHaveBeenCalledOnce();

    // STEP 2: Cancel the order
    const orderWithItems = {
      id: 'order1',
      state: { name: 'PENDING' },
      items: [
        {
          productId: 'p1',
          combinationId: null,
          quantity: 2,
        },
      ],
    } as never;
    const cancelledState = { id: 'state2', name: 'CANCELLED' } as never;
    const cancelledOrder = {
      id: 'order1',
      state: { name: 'CANCELLED' },
    } as never;

    prisma.order.findUnique.mockResolvedValue(orderWithItems);
    prisma.orderState.findUnique.mockResolvedValue(cancelledState);
    prisma.order.update.mockResolvedValue(cancelledOrder);
    prisma.orderHistory.create.mockResolvedValue({} as never);
    prisma.stock.update.mockResolvedValue({} as never);

    const result = await actionService.cancelOrder('order1');
    expect(result).toBe(cancelledOrder);
  });

  it('should prevent double creation via idempotency key', async () => {
    const existingOrder = {
      id: 'order1',
      idempotencyKey: 'key-1',
      items: [],
      state: { name: 'PENDING' },
      addresses: [],
    } as never;

    prisma.order.findUnique.mockResolvedValue(existingOrder);

    const first = await creationService.createOrderFromCart(
      'cart1',
      'cust1',
      'addr1',
      'addr2',
      'key-1',
    );

    expect(first).toBe(existingOrder);
    expect(cartService.getCartWithTotals).not.toHaveBeenCalled();
  });

  it('should reject empty cart', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    cartService.getCartWithTotals.mockResolvedValue({
      items: [],
      customerId: 'cust1',
    } as never);

    await expect(
      creationService.createOrderFromCart('cart1', 'cust1', 'addr1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject cart belonging to different customer', async () => {
    prisma.order.findUnique.mockResolvedValue(null);
    cartService.getCartWithTotals.mockResolvedValue({
      items: [{ id: 'item1' }],
      customerId: 'cust2',
    } as never);

    await expect(
      creationService.createOrderFromCart('cart1', 'cust1', 'addr1'),
    ).rejects.toThrow('Cart does not belong to this customer');
  });
});
