import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PaymentService } from './payment.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { PaymentAdapterRegistry } from './payment-adapter.registry';
import { PaymentWebhookSecurityService } from './payment-webhook-security.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

/**
 * Integration test: processPaymentWebhook flow.
 * Validates webhook processing from signature verification through status update.
 */
describe('PaymentService — processPaymentWebhook integration', () => {
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
      get: vi.fn(),
    } as unknown as Mocked<PaymentAdapterRegistry>;

    webhookSecurity = {
      assertValidWebhook: vi.fn(),
    } as unknown as Mocked<PaymentWebhookSecurityService>;

    service = new PaymentService(prisma, adapters, webhookSecurity);
  });

  describe('processWebhook — happy path', () => {
    it('should verify signature, store event, and update payment status', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('sha256hash');
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay1',
        provider: 'stripe',
        status: 'PENDING',
      } as never);
      prisma.payment.update.mockResolvedValue({
        id: 'pay1',
        status: 'COMPLETED',
      } as never);

      const payload = JSON.stringify({
        paymentId: 'pay1',
        status: 'COMPLETED',
      });

      const result = await service.processWebhook(
        'stripe',
        'evt_123',
        payload,
        'sig_abc',
      );

      expect(result).toBe(true);
      expect(webhookSecurity.assertValidWebhook).toHaveBeenCalledWith(
        'stripe',
        'evt_123',
        payload,
        'sig_abc',
      );
      expect(prisma.paymentWebhookEvent.upsert).toHaveBeenCalled();
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay1' },
        data: { status: 'COMPLETED' },
      });
    });
  });

  describe('processWebhook — security rejection', () => {
    it('should reject webhook with invalid signature', async () => {
      webhookSecurity.assertValidWebhook.mockRejectedValue(
        new UnauthorizedException('Invalid webhook signature'),
      );

      await expect(
        service.processWebhook('stripe', 'evt_bad', '{}', 'invalid_sig'),
      ).rejects.toThrow(UnauthorizedException);

      expect(prisma.paymentWebhookEvent.upsert).not.toHaveBeenCalled();
    });
  });

  describe('processWebhook — invalid payload', () => {
    it('should reject non-JSON payload', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('hash');

      await expect(
        service.processWebhook('stripe', 'evt_1', 'not-json', 'sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject array payload', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('hash');

      await expect(
        service.processWebhook('stripe', 'evt_1', '[1,2,3]', 'sig'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('processWebhook — status transition guards', () => {
    it('should NOT downgrade COMPLETED to PENDING', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('hash');
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay1',
        provider: 'stripe',
        status: 'COMPLETED',
      } as never);

      const payload = JSON.stringify({
        paymentId: 'pay1',
        status: 'PENDING',
      });

      const result = await service.processWebhook(
        'stripe',
        'evt_456',
        payload,
        'sig',
      );

      expect(result).toBe(true);
      // Payment.update should NOT be called — COMPLETED → PENDING is invalid
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('should NOT update REFUNDED payment', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('hash');
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay1',
        provider: 'stripe',
        status: 'REFUNDED',
      } as never);

      const payload = JSON.stringify({
        paymentId: 'pay1',
        status: 'COMPLETED',
      });

      await service.processWebhook('stripe', 'evt_789', payload, 'sig');
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('should allow COMPLETED → REFUNDED transition', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('hash');
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay1',
        provider: 'stripe',
        status: 'COMPLETED',
      } as never);
      prisma.payment.update.mockResolvedValue({} as never);

      const payload = JSON.stringify({
        paymentId: 'pay1',
        status: 'REFUNDED',
      });

      await service.processWebhook('stripe', 'evt_ref', payload, 'sig');
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay1' },
        data: { status: 'REFUNDED' },
      });
    });
  });

  describe('processWebhook — idempotency', () => {
    it('should handle duplicate event IDs via upsert', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('hash');
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue({
        id: 'pay1',
        provider: 'stripe',
        status: 'PENDING',
      } as never);
      prisma.payment.update.mockResolvedValue({} as never);

      const payload = JSON.stringify({
        paymentId: 'pay1',
        status: 'COMPLETED',
      });

      // Process same event twice
      await service.processWebhook('stripe', 'evt_dup', payload, 'sig');
      await service.processWebhook('stripe', 'evt_dup', payload, 'sig');

      // Upsert should be called twice (handles dedup)
      expect(prisma.paymentWebhookEvent.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('processWebhook — provider normalization', () => {
    it('should normalize provider to lowercase', async () => {
      webhookSecurity.assertValidWebhook.mockResolvedValue('hash');
      prisma.paymentWebhookEvent.upsert.mockResolvedValue({} as never);
      prisma.payment.findFirst.mockResolvedValue(null);

      const payload = JSON.stringify({ someField: 'value' });

      await service.processWebhook('STRIPE', 'evt_1', payload, 'sig');

      expect(webhookSecurity.assertValidWebhook).toHaveBeenCalledWith(
        'stripe',
        'evt_1',
        payload,
        'sig',
      );
    });
  });
});
