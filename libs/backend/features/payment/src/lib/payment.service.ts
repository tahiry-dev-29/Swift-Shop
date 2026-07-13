import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Prisma } from '@swift-shop/prisma-client';
import { PaymentAdapterRegistry } from './payment-adapter.registry';
import { PaymentWebhookSecurityService } from './payment-webhook-security.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adapters: PaymentAdapterRegistry,
    private readonly webhookSecurity: PaymentWebhookSecurityService,
  ) {}

  async initiatePayment(
    orderId: string,
    provider: string,
    amount?: number,
    currency = 'EUR',
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const existing = await this.prisma.payment.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return this.serializePayment(existing);
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const expectedAmount = Number(order.totalTTC);
    if (amount !== undefined && amount !== expectedAmount) {
      throw new BadRequestException(
        `Payment amount must match the order total of ${expectedAmount}`,
      );
    }
    const paymentAmount = expectedAmount;

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider: provider.toLowerCase(),
        amount: paymentAmount,
        currency,
        idempotencyKey,
      },
    });

    const adapter = this.adapters.get(provider);
    const result = await adapter.initiate({
      paymentId: payment.id,
      orderId,
      amount: paymentAmount,
      currency,
    });

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: result.externalId,
        status: result.status,
        metadata: this.toJson(result.metadata),
      },
    });

    return this.serializePayment(updated);
  }

  async verifyPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const result = await this.adapters.get(payment.provider).verify(payment);
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: result.externalId,
        status: result.status,
        metadata: this.toJson(result.metadata),
      },
    });

    return this.serializePayment(updated);
  }

  async processRefund(paymentId: string, amount: number, reason?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Refund amount must be positive');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const refundAggregate = await this.prisma.refund.aggregate({
      where: { paymentId, status: { not: 'FAILED' } },
      _sum: { amount: true },
    });
    const totalRefunded = Number(refundAggregate._sum.amount || 0);

    if (totalRefunded + amount > Number(payment.amount)) {
      throw new BadRequestException('Refund cannot exceed payment amount');
    }

    const result = await this.adapters.get(payment.provider).refund({
      paymentId,
      amount,
      reason,
    });

    const refund = await this.prisma.refund.create({
      data: {
        paymentId,
        amount,
        reason,
        status: result.status,
        externalId: result.externalId,
        metadata: this.toJson(result.metadata),
      },
    });

    return { ...refund, amount: Number(refund.amount) };
  }

  async processWebhook(
    provider: string,
    eventId: string,
    payload: string,
    signature: string,
  ) {
    const normalizedProvider = provider.toLowerCase();
    const payloadHash = await this.webhookSecurity.assertValidWebhook(
      normalizedProvider,
      eventId,
      payload,
      signature,
    );
    const parsedPayload = this.parsePayload(payload);

    await this.prisma.paymentWebhookEvent.upsert({
      where: { provider_eventId: { provider: normalizedProvider, eventId } },
      update: {
        payloadHash,
        payload: parsedPayload as Prisma.InputJsonObject,
        processedAt: new Date(),
      },
      create: {
        provider: normalizedProvider,
        eventId,
        signature,
        payloadHash,
        payload: parsedPayload as Prisma.InputJsonObject,
        processedAt: new Date(),
      },
    });

    const paymentId =
      typeof parsedPayload.paymentId === 'string'
        ? parsedPayload.paymentId
        : undefined;
    const status =
      typeof parsedPayload.status === 'string'
        ? parsedPayload.status
        : undefined;

    if (paymentId && status) {
      const payment = await this.prisma.payment.findFirst({
        where: { id: paymentId, provider: normalizedProvider },
      });
      if (payment) {
        // Validate transitions (prevent going backward)
        const current = payment.status;
        const invalid =
          current === 'REFUNDED' ||
          current === 'FAILED' ||
          (current === 'COMPLETED' && status !== 'REFUNDED');

        if (!invalid) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status },
          });
        }
      }
    }

    return true;
  }

  private parsePayload(payload: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(payload);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    throw new BadRequestException('Invalid webhook payload');
  }

  private serializePayment<T extends { amount: unknown }>(payment: T) {
    return { ...payment, amount: Number(payment.amount) };
  }

  private toJson(value?: Record<string, unknown>) {
    return value as Prisma.InputJsonObject | undefined;
  }
}
