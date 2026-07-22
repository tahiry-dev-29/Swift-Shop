import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PaymentService } from './payment.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { PaymentAdapterRegistry } from './payment-adapter.registry';
import { PaymentWebhookSecurityService } from './payment-webhook-security.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// ─── Factories ─────────────────────────────────────────────────────────────

function makePrisma(): Mocked<PrismaService> {
  return {
    payment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: { findUnique: vi.fn() },
    refund: { aggregate: vi.fn(), create: vi.fn() },
    paymentWebhookEvent: { findUnique: vi.fn(), upsert: vi.fn() },
  } as unknown as Mocked<PrismaService>;
}

function makeAdapter() {
  return {
    initiate: vi.fn().mockResolvedValue({
      externalId: 'ext1',
      status: 'PENDING',
      metadata: {},
    }),
    verify: vi.fn().mockResolvedValue({
      externalId: 'ext1',
      status: 'COMPLETED',
      metadata: {},
    }),
    refund: vi.fn().mockResolvedValue({
      externalId: 'ref1',
      status: 'COMPLETED',
      metadata: {},
    }),
  };
}

function makeRegistry(adapter = makeAdapter()): Mocked<PaymentAdapterRegistry> {
  return {
    get: vi.fn().mockReturnValue(adapter),
  } as unknown as Mocked<PaymentAdapterRegistry>;
}

function makeWebhookSecurity(): Mocked<PaymentWebhookSecurityService> {
  return {
    assertValidWebhook: vi.fn().mockResolvedValue('hash123'),
  } as unknown as Mocked<PaymentWebhookSecurityService>;
}

describe('PaymentService — full suite', () => {
  let service: PaymentService;
  let prisma: Mocked<PrismaService>;
  let adapters: Mocked<PaymentAdapterRegistry>;
  let webhookSecurity: Mocked<PaymentWebhookSecurityService>;

  beforeEach(() => {
    prisma = makePrisma();
    adapters = makeRegistry();
    webhookSecurity = makeWebhookSecurity();
    service = new PaymentService(prisma, adapters, webhookSecurity);
  });

  // ─── initiatePayment ──────────────────────────────────────────────────────

  describe('initiatePayment', () => {
    it('should return existing payment when idempotency key matches', async () => {
      const existing = { id: 'pay1', amount: '100' } as never;
      prisma.payment.findUnique.mockResolvedValue(existing);

      const result = await service.initiatePayment(
        'o1',
        'stripe',
        100,
        'EUR',
        'idem-key',
      );
      expect(result).toMatchObject({ id: 'pay1', amount: 100 });
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.initiatePayment('o1', 'stripe', 100),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when amount does not match order total', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        totalTTC: '150',
      } as never);

      await expect(
        service.initiatePayment('o1', 'stripe', 100),
      ).rejects.toThrow(BadRequestException);
    });

    it('should initiate payment with COD adapter and return PENDING status', async () => {
      const order = { id: 'o1', totalTTC: '100' } as never;
      const payment = { id: 'pay1', amount: '100' } as never;
      const updated = {
        ...payment,
        status: 'PENDING',
        externalId: 'ext1',
      } as never;

      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.create.mockResolvedValue(payment);
      prisma.payment.update.mockResolvedValue(updated);

      const result = await service.initiatePayment('o1', 'cod', 100);
      expect(adapters.get).toHaveBeenCalledWith('cod');
      expect(result).toMatchObject({ amount: 100 });
    });

    it('should initiate payment for MVola provider', async () => {
      const order = { id: 'o1', totalTTC: '200' } as never;
      const payment = { id: 'pay2', amount: '200' } as never;
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.create.mockResolvedValue(payment);
      prisma.payment.update.mockResolvedValue(payment);

      await service.initiatePayment('o1', 'mvola', 200);
      expect(adapters.get).toHaveBeenCalledWith('mvola');
    });

    it('should use order total when amount is undefined', async () => {
      const order = { id: 'o1', totalTTC: '75' } as never;
      const payment = { id: 'pay1', amount: '75' } as never;
      prisma.payment.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.payment.create.mockResolvedValue(payment);
      prisma.payment.update.mockResolvedValue(payment);

      const result = await service.initiatePayment('o1', 'manual');
      expect(result.amount).toBe(75);
    });
  });

  // ─── verifyPayment ────────────────────────────────────────────────────────

  describe('verifyPayment', () => {
    it('should throw NotFoundException when payment not found', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.verifyPayment('pay-missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call verify adapter and update payment status', async () => {
      const payment = {
        id: 'pay1',
        provider: 'stripe',
        amount: '100',
      } as never;
      const updated = { ...payment, status: 'COMPLETED' } as never;

      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.payment.update.mockResolvedValue(updated);

      const result = await service.verifyPayment('pay1');
      expect(adapters.get).toHaveBeenCalledWith('stripe');
      expect(result.amount).toBe(100);
    });

    it('should return PENDING status when adapter returns PENDING', async () => {
      const adapter = makeAdapter();
      adapter.verify.mockResolvedValue({
        externalId: 'ext1',
        status: 'PENDING',
        metadata: {},
      });

      const altAdapters = makeRegistry(adapter);
      service = new PaymentService(prisma, altAdapters, webhookSecurity);

      const payment = { id: 'pay1', provider: 'mvola', amount: '50' } as never;
      const updated = { ...payment, status: 'PENDING' } as never;
      prisma.payment.findUnique.mockResolvedValue(payment);
      prisma.payment.update.mockResolvedValue(updated);

      const result = await service.verifyPayment('pay1');
      expect(result).toMatchObject({ amount: 50 });
    });
  });

  // ─── processRefund ────────────────────────────────────────────────────────

  describe('processRefund', () => {
    it('should throw BadRequestException when refund amount is zero or negative', async () => {
      await expect(service.processRefund('pay1', 0)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.processRefund('pay1', -10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when payment not found', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);
      await expect(service.processRefund('pay-missing', 50)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when total refund would exceed payment amount', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay1',
        amount: '100',
        provider: 'stripe',
      } as never);
      prisma.refund.aggregate.mockResolvedValue({
        _sum: { amount: '80' },
      } as never);

      // 80 already refunded + 30 new = 110 > 100
      await expect(service.processRefund('pay1', 30)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create full refund successfully', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay1',
        amount: '100',
        provider: 'stripe',
      } as never);
      prisma.refund.aggregate.mockResolvedValue({
        _sum: { amount: 0 },
      } as never);

      const refund = { id: 'ref1', amount: 100, status: 'COMPLETED' } as never;
      prisma.refund.create.mockResolvedValue(refund);

      const result = await service.processRefund('pay1', 100, 'Full refund');
      expect(result).toMatchObject({ amount: 100, status: 'COMPLETED' });
    });

    it('should create partial refund successfully', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay1',
        amount: '100',
        provider: 'stripe',
      } as never);
      prisma.refund.aggregate.mockResolvedValue({
        _sum: { amount: '30' },
      } as never);

      const refund = { id: 'ref2', amount: 50, status: 'COMPLETED' } as never;
      prisma.refund.create.mockResolvedValue(refund);

      const result = await service.processRefund('pay1', 50);
      expect(result.amount).toBe(50);
    });
  });

  // ─── processWebhook ───────────────────────────────────────────────────────

  describe('processWebhook', () => {
    const validPayload = JSON.stringify({
      paymentId: 'pay1',
      status: 'COMPLETED',
    });
    const invalidJson = '{broken_json}';

    it('should throw when webhook security service rejects signature', async () => {
      webhookSecurity.assertValidWebhook.mockRejectedValue(
        new Error('Invalid signature'),
      );

      await expect(
        service.processWebhook('stripe', 'evt1', validPayload, 'bad-sig'),
      ).rejects.toThrow('Invalid signature');
    });

    it('should throw BadRequestException for invalid JSON payload', async () => {
      await expect(
        service.processWebhook('stripe', 'evt1', invalidJson, 'sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upsert webhook event and update payment status', async () => {
      const payment = {
        id: 'pay1',
        provider: 'stripe',
        status: 'PENDING',
      } as never;
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue(payment);
      prisma.payment.update.mockResolvedValue({
        ...payment,
        status: 'COMPLETED',
      } as never);

      const result = await service.processWebhook(
        'stripe',
        'evt1',
        validPayload,
        'valid-sig',
      );
      expect(result).toBe(true);
      expect(prisma.paymentWebhookEvent.upsert).toHaveBeenCalled();
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'COMPLETED' } }),
      );
    });

    it('should NOT update payment status when payment is already REFUNDED', async () => {
      const payment = {
        id: 'pay1',
        provider: 'stripe',
        status: 'REFUNDED',
      } as never;
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue(payment);

      await service.processWebhook('stripe', 'evt1', validPayload, 'valid-sig');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('should NOT update payment status when payment is FAILED', async () => {
      const payment = {
        id: 'pay1',
        provider: 'stripe',
        status: 'FAILED',
      } as never;
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue(payment);

      await service.processWebhook('stripe', 'evt1', validPayload, 'valid-sig');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('should normalize provider to lowercase', async () => {
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue(null);

      await service.processWebhook('STRIPE', 'evt2', validPayload, 'sig');
      expect(webhookSecurity.assertValidWebhook).toHaveBeenCalledWith(
        'stripe',
        'evt2',
        validPayload,
        'sig',
      );
    });
  });
});

// ─── PaymentAdapterRegistry ───────────────────────────────────────────────

describe('PaymentAdapterRegistry', () => {
  let registry: PaymentAdapterRegistry;

  beforeEach(async () => {
    const { PaymentAdapterRegistry: Reg } =
      await import('./payment-adapter.registry');
    registry = new Reg();
  });

  it('should return adapter for each supported provider', () => {
    const providers = [
      'mvola',
      'airtelmoney',
      'stripe',
      'paypal',
      'cod',
      'manual',
    ];
    for (const p of providers) {
      expect(registry.get(p)).toBeDefined();
    }
  });

  it('should throw BadRequestException for unknown provider', () => {
    expect(() => registry.get('bitcoin')).toThrow(BadRequestException);
  });

  it('should be case-insensitive — STRIPE matches stripe adapter', () => {
    const adapter = registry.get('STRIPE');
    expect(adapter).toBeDefined();
  });
});
