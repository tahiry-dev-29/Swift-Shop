import { createHash, createHmac, timingSafeEqual } from 'crypto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class PaymentWebhookSecurityService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async assertValidWebhook(
    provider: string,
    eventId: string,
    payload: string,
    signature: string,
  ) {
    const secret =
      this.configService.get<string>(
        `${provider.toUpperCase()}_WEBHOOK_SECRET`,
      ) ?? this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');

    if (secret) {
      const expected = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      const expectedBuffer = Buffer.from(expected);
      const actualBuffer = Buffer.from(signature);

      if (
        expectedBuffer.length !== actualBuffer.length ||
        !timingSafeEqual(expectedBuffer, actualBuffer)
      ) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const payloadHash = createHash('sha256').update(payload).digest('hex');
    const existing = await this.prisma.paymentWebhookEvent.findUnique({
      where: { provider_eventId: { provider, eventId } },
    });

    if (existing) {
      throw new BadRequestException('Webhook event already processed');
    }

    return payloadHash;
  }
}
