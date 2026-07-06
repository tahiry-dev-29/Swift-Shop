import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { RedisService } from '@swift-shop/backend/auth';

const ABANDONED_CART_MIN_AGE_HOURS = 24;
const ABANDONED_CART_DEDUP_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class AbandonedCartRecoveryService {
  private readonly logger = new Logger(AbandonedCartRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async enqueueAbandonedCartRecovery() {
    const carts = await this.findRecoverableCarts();
    for (const cart of carts) {
      await this.redisService.setJson(
        this.recoveryKey(cart.id),
        { cartId: cart.id, queuedAt: new Date().toISOString() },
        ABANDONED_CART_DEDUP_TTL_SECONDS,
      );
    }

    if (carts.length > 0) {
      this.logger.log(`Queued ${carts.length} abandoned cart recoveries`);
    }
  }

  async findRecoverableCarts() {
    const cutoff = new Date(
      Date.now() - ABANDONED_CART_MIN_AGE_HOURS * 60 * 60 * 1000,
    );
    const carts = await this.prisma.cart.findMany({
      where: {
        dateUpd: { lt: cutoff },
        items: { some: {} },
        customer: { is: { active: true } },
      },
      include: {
        customer: true,
        items: true,
      },
      take: 100,
      orderBy: { dateUpd: 'asc' },
    });

    const recoverableCarts = [];
    for (const cart of carts) {
      const alreadyQueued = await this.redisService.getJson(
        this.recoveryKey(cart.id),
      );
      if (!alreadyQueued) {
        recoverableCarts.push(cart);
      }
    }

    return recoverableCarts;
  }

  private recoveryKey(cartId: string) {
    return `commerce:abandoned-cart:${cartId}`;
  }
}
