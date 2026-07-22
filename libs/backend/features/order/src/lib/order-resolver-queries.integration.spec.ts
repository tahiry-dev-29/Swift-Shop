import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { OrderResolver } from './order-resolver';
import { OrderService } from './order-service';
import { OrderCreationService } from './order-creation.service';
import { OrderActionService } from './order-action.service';

describe('OrderResolver GraphQL queries & mutations', () => {
  let resolver: OrderResolver;
  let orderService: Mocked<OrderService>;
  let creationService: Mocked<OrderCreationService>;
  let actionService: Mocked<OrderActionService>;

  const mockOrder = {
    id: 'ord-1',
    reference: 'DO-20260722-00001',
    customerId: 'cust-1',
    state: { name: 'PENDING' },
  };

  beforeEach(() => {
    orderService = {
      getMyOrders: vi.fn(),
      getOrder: vi.fn(),
      getOrderStates: vi.fn(),
      generateInvoicePDF: vi.fn(),
      reorderToCart: vi.fn(),
      exportOrders: vi.fn(),
      addOrderNote: vi.fn(),
    } as any;
    creationService = {
      createOrderFromCart: vi.fn(),
      createGuestOrderFromCart: vi.fn(),
    } as any;
    actionService = {
      cancelOrder: vi.fn(),
      requestReturn: vi.fn(),
    } as any;
    const mockPubSub = {
      asyncIterableIterator: vi.fn(),
    };

    resolver = new OrderResolver(
      orderService,
      creationService,
      actionService,
      mockPubSub as any,
    );
  });

  it('createGuestOrder mutation — should create guest order with address snapshot and identity', async () => {
    const input = {
      cartId: 'cart-guest',
      email: 'guest@example.com',
      firstname: 'Jane',
      lastname: 'Doe',
      deliveryAddressId: 'addr-1',
      billingAddressId: 'addr-1',
    };
    creationService.createGuestOrderFromCart.mockResolvedValue(
      mockOrder as any,
    );

    const res = await resolver.createGuestOrder(input as any);
    expect(creationService.createGuestOrderFromCart).toHaveBeenCalledWith(
      input,
    );
    expect(res).toEqual(mockOrder);
  });

  it('myOrders query — should return customer orders only', async () => {
    orderService.getMyOrders.mockResolvedValue([mockOrder as any]);

    const res = await resolver.myOrders({ id: 'cust-1' });
    expect(orderService.getMyOrders).toHaveBeenCalledWith('cust-1');
    expect(res).toEqual([mockOrder]);
  });

  it('generateInvoice mutation — should generate PDF invoice reference for order', async () => {
    const mockInvoice = {
      filename: 'invoice.pdf',
      url: '/invoices/invoice.pdf',
    };
    orderService.getOrder.mockResolvedValue(mockOrder as any);
    orderService.generateInvoicePDF.mockResolvedValue(mockInvoice as any);

    const res = await resolver.generateInvoice('ord-1', { id: 'cust-1' });
    expect(orderService.getOrder).toHaveBeenCalledWith('ord-1', 'cust-1');
    expect(orderService.generateInvoicePDF).toHaveBeenCalledWith('ord-1');
    expect(res).toEqual(mockInvoice);
  });

  it('reorder mutation — should populate new cart from past order items', async () => {
    const mockCart = {
      id: 'cart-new',
      items: [{ productId: 'prod-1', quantity: 2 }],
    };
    orderService.reorderToCart.mockResolvedValue(mockCart as any);

    const res = await resolver.reorder('ord-1', { id: 'cust-1' });
    expect(orderService.reorderToCart).toHaveBeenCalledWith('ord-1', 'cust-1');
    expect(res).toEqual(mockCart);
  });

  it('exportMyOrders query — should trigger CSV download payload export', async () => {
    const mockExport = {
      format: 'csv',
      filename: 'orders.csv',
      base64: 'abc==',
    };
    orderService.exportOrders.mockResolvedValue(mockExport as any);

    const res = await resolver.exportMyOrders({ id: 'cust-1' }, 'csv');
    expect(orderService.exportOrders).toHaveBeenCalledWith('cust-1', 'csv');
    expect(res).toEqual(mockExport);
  });
});
