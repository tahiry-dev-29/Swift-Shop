import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { RedisService } from '@dima-new/backend/auth';

const DEFAULT_STOCK_RESERVATION_TTL_SECONDS = 15 * 60;

type StockReservation = {
  cartId: string;
  stockId: string;
  quantity: number;
  expiresAt: string;
};

@Injectable()
export class CartStockReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async reserveCartStock(
    cartId: string,
    ttlSeconds = DEFAULT_STOCK_RESERVATION_TTL_SECONDS,
  ) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: { include: { stock: true } },
            combination: { include: { stock: true } },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const reservations = cart.items
      .map((item) => ({
        stock: item.combination?.stock ?? item.product.stock,
        quantity: item.quantity,
        productName: item.product.name,
      }))
      .filter((item) => item.stock?.outOfStockBehavior === 'deny');

    for (const reservation of reservations) {
      const stock = reservation.stock;
      if (!stock) {
        continue;
      }
      const reservedQuantity = await this.getReservedQuantity(stock.id, cartId);
      const availableQuantity = stock.quantity - reservedQuantity;
      if (availableQuantity < reservation.quantity) {
        throw new BadRequestException(
          `Only ${availableQuantity} items available for ${reservation.productName}`,
        );
      }
    }

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    await Promise.all(
      reservations.map((reservation) =>
        reservation.stock
          ? this.redisService.setJson<StockReservation>(
              this.reservationKey(cartId, reservation.stock.id),
              {
                cartId,
                stockId: reservation.stock.id,
                quantity: reservation.quantity,
                expiresAt,
              },
              ttlSeconds,
            )
          : Promise.resolve(),
      ),
    );

    return {
      cartId,
      expiresAt,
      reservedItems: reservations.length,
    };
  }

  async releaseCartStock(cartId: string) {
    await this.redisService.deleteByPattern(
      `commerce:stock-lock:cart:${cartId}:stock:*`,
    );
  }

  async getReservedQuantity(stockId: string, excludeCartId?: string) {
    const keys = await this.redisService.keysByPattern(
      'commerce:stock-lock:cart:*:stock:*',
    );
    let quantity = 0;

    for (const key of keys) {
      const reservation =
        await this.redisService.getJson<StockReservation>(key);
      if (
        reservation?.stockId === stockId &&
        reservation.cartId !== excludeCartId
      ) {
        quantity += reservation.quantity;
      }
    }

    return quantity;
  }

  private reservationKey(cartId: string, stockId: string) {
    return `commerce:stock-lock:cart:${cartId}:stock:${stockId}`;
  }
}
