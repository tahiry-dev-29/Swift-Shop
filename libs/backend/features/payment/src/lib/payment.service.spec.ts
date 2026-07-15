import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PaymentService } from './payment.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { PaymentAdapterRegistry } from './payment-adapter.registry';
import { PaymentWebhookSecurityService } from './payment-webhook-security.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: Mocked<PrismaService>;
  let adapters: Mocked<PaymentAdapterRegistry>;
  let webhookSecurity: Mocked<PaymentWebhookSecurityService>;

  beforeEach(() => {
    prisma = {
      payment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
      },
      order: { findUnique: vi.fn() },
      refund: { aggregate: vi.fn(), create: vi.fn() },
      paymentWebhookEvent: { upsert: vi.fn() },
      $transaction: vi.fn((cb) => cb(prisma)),
    } as unknown as Mocked<PrismaService>;

    adapters = {
      get: vi.fn().mockReturnValue({
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
      }),
    } as unknown as Mocked<PaymentAdapterRegistry>;

    webhookSecurity = {
      assertValidWebhook: vi.fn().mockResolvedValue('hash123'),
    } as unknown as Mocked<PaymentWebhookSecurityService>;

    service = new PaymentService(prisma, adapters, webhookSecurity);
  });

  it('should throw NotFoundException if order not found during initiatePayment', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.initiatePayment('order1', 'stripe', 100),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException if amount does not match order total', async () => {
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      id: 'order1',
      totalTTC: '100',
    } as never);

    await expect(
      service.initiatePayment('order1', 'stripe', 50),
    ).rejects.toThrow(BadRequestException);
  });

  it('should initiate payment successfully if amount matches order total', async () => {
    const mockOrder = { id: 'order1', totalTTC: '100' } as never;
    const mockPayment = { id: 'pay1', amount: 100 } as never;

    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue(mockOrder);
    prisma.payment.create.mockResolvedValue(mockPayment);
    prisma.payment.update.mockResolvedValue(mockPayment);

    const result = await service.initiatePayment('order1', 'stripe', 100);
    expect(result).toHaveProperty('amount', 100);
  });
});
