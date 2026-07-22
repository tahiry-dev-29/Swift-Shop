import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { createHmac, createHash } from 'crypto';
import { PaymentWebhookSecurityService } from './payment-webhook-security.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

function makePrisma(): Mocked<PrismaService> {
  return {
    paymentWebhookEvent: { findUnique: vi.fn() },
  } as unknown as Mocked<PrismaService>;
}

function makeConfig(
  values: Record<string, string | undefined> = {},
): Mocked<ConfigService> {
  return {
    get: vi.fn((key: string) => values[key]),
  } as unknown as Mocked<ConfigService>;
}

function computeHmac(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

function computeHash(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

describe('PaymentWebhookSecurityService', () => {
  let service: PaymentWebhookSecurityService;
  let prisma: Mocked<PrismaService>;
  let configService: Mocked<ConfigService>;

  const payload = JSON.stringify({ paymentId: 'pay1', status: 'COMPLETED' });
  const eventId = 'evt-001';
  const provider = 'stripe';
  const secret = 'super-secret-key';

  beforeEach(() => {
    prisma = makePrisma();
    configService = makeConfig();
    service = new PaymentWebhookSecurityService(configService, prisma);
  });

  // ─── HMAC Validation ──────────────────────────────────────────────────────

  describe('HMAC signature validation', () => {
    it('should throw UnauthorizedException when HMAC signature is invalid', async () => {
      configService.get.mockReturnValue(secret);
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.assertValidWebhook(provider, eventId, payload, 'bad-signature'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should pass validation when HMAC signature is correct', async () => {
      configService.get.mockReturnValue(secret);
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      const validSig = computeHmac(secret, payload);
      const result = await service.assertValidWebhook(
        provider,
        eventId,
        payload,
        validSig,
      );

      expect(result).toBe(computeHash(payload));
    });

    it('should use provider-specific secret when STRIPE_WEBHOOK_SECRET is set', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_WEBHOOK_SECRET') return secret;
        return undefined;
      });
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      const validSig = computeHmac(secret, payload);

      await expect(
        service.assertValidWebhook('stripe', eventId, payload, validSig),
      ).resolves.toBeDefined();
    });

    it('should fall back to PAYMENT_WEBHOOK_SECRET when provider-specific secret is absent', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'PAYMENT_WEBHOOK_SECRET') return secret;
        return undefined;
      });
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      const validSig = computeHmac(secret, payload);

      await expect(
        service.assertValidWebhook('stripe', eventId, payload, validSig),
      ).resolves.toBeDefined();
    });

    it('should skip HMAC check entirely when no secret is configured', async () => {
      // Both secrets undefined → no HMAC validation
      configService.get.mockReturnValue(undefined);
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      const result = await service.assertValidWebhook(
        provider,
        eventId,
        payload,
        'any-signature',
      );
      expect(result).toBe(computeHash(payload));
    });
  });

  // ─── Replay protection ────────────────────────────────────────────────────

  describe('Replay protection', () => {
    it('should throw BadRequestException when webhook event was already processed', async () => {
      configService.get.mockReturnValue(undefined); // skip HMAC
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue({
        id: 'existing-event',
        provider,
        eventId,
      } as never);

      await expect(
        service.assertValidWebhook(provider, eventId, payload, 'sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow processing of a new (unseen) webhook event', async () => {
      configService.get.mockReturnValue(undefined); // skip HMAC
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      await expect(
        service.assertValidWebhook(provider, eventId, payload, 'sig'),
      ).resolves.not.toThrow();
    });

    it('should check replay with provider + eventId composite key', async () => {
      configService.get.mockReturnValue(undefined);
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      await service.assertValidWebhook('mvola', 'evt-mvola-1', payload, 'sig');

      expect(prisma.paymentWebhookEvent.findUnique).toHaveBeenCalledWith({
        where: {
          provider_eventId: { provider: 'mvola', eventId: 'evt-mvola-1' },
        },
      });
    });
  });

  // ─── Return value ─────────────────────────────────────────────────────────

  describe('Return value', () => {
    it('should return SHA-256 hash of the payload', async () => {
      configService.get.mockReturnValue(undefined);
      prisma.paymentWebhookEvent.findUnique.mockResolvedValue(null);

      const result = await service.assertValidWebhook(
        provider,
        eventId,
        payload,
        'sig',
      );
      expect(result).toBe(computeHash(payload));
    });
  });
});
