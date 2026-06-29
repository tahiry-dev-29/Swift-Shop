import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { CartService } from '@dima-new/backend/cart';
import { GuestCheckoutService } from './guest-checkout.service';
import { OrderAddressSnapshotService } from './order-address-snapshot.service';

@Injectable()
export class OrderCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly guestCheckoutService: GuestCheckoutService,
    private readonly orderAddressService: OrderAddressSnapshotService,
  ) {}

  private generateReference(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `DO-${date}-${random}`;
  }

  /**
   * Create an order from a cart
   */
  async createOrderFromCart(
    cartId: string,
    customerId: string,
    deliveryAddressId: string,
    billingAddressId?: string,
    idempotencyKey?: string,
    deliveryAddressIds?: string[],
  ) {
    if (idempotencyKey) {
      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey },
        include: { state: true, items: true, addresses: true },
      });
      if (existingOrder) {
        return existingOrder;
      }
    }

    const cart = await this.cartService.getCartWithTotals(cartId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (cart.customerId !== customerId) {
      throw new BadRequestException('Cart does not belong to this customer');
    }

    await this.cartService.reserveStock(cartId);

    const deliveryAddressList =
      await this.orderAddressService.getDeliveryAddresses(
        deliveryAddressIds?.length ? deliveryAddressIds : [deliveryAddressId],
      );
    const billingAddress = await this.orderAddressService.getBillingAddress(
      billingAddressId,
      deliveryAddressList[0],
    );

    let state = await this.prisma.orderState.findUnique({
      where: { name: 'PENDING' },
    });
    if (!state) {
      state = await this.prisma.orderState.create({
        data: { name: 'PENDING', color: '#fbbf24', position: 0 },
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            reference: this.generateReference(),
            customerId,
            stateId: state.id,
            totalHT: cart.totalHT ?? 0,
            totalTax: cart.totalTax ?? 0,
            totalTTC: cart.totalTTC ?? 0,
            discountTotal: cart.discountTotal ?? 0,
            idempotencyKey,
          },
          include: { state: true },
        });

        for (const [index, deliveryAddress] of deliveryAddressList.entries()) {
          await tx.orderAddress.create({
            data: {
              orderId: order.id,
              type: index === 0 ? 'delivery' : `delivery:${index + 1}`,
              ...this.orderAddressService.toOrderAddressSnapshot(
                deliveryAddress,
              ),
            },
          });
        }

        await tx.orderAddress.create({
          data: {
            orderId: order.id,
            type: 'billing',
            ...this.orderAddressService.toOrderAddressSnapshot(billingAddress),
          },
        });

        for (const item of cart.items) {
          const priceDetail = item.priceDetail;
          const unitHT = priceDetail ? priceDetail.priceHT : item.product.price;
          const taxRate = priceDetail ? priceDetail.taxRate : 0;
          const lineHT = priceDetail
            ? Number(priceDetail.priceHT) * item.quantity
            : Number(item.product.price) * item.quantity;
          const lineTTC = priceDetail
            ? Number(priceDetail.priceTTC) * item.quantity
            : Number(item.product.price) * item.quantity;

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              combinationId: item.combinationId || null,
              productName: item.product.name,
              productRef:
                item.combination?.reference ||
                `REF-${item.product.id.substring(0, 8)}`,
              quantity: item.quantity,
              unitPriceHT: Number(unitHT || 0),
              taxRate: Number(taxRate || 0),
              totalHT: lineHT,
              totalTTC: lineTTC,
            },
          });

          const stock = item.combination?.stock || item.product.stock;
          if (stock) {
            const updateResult = await tx.stock.updateMany({
              where: { id: stock.id, quantity: { gte: item.quantity } },
              data: { quantity: { decrement: item.quantity } },
            });
            if (updateResult.count !== 1) {
              throw new BadRequestException(
                `Insufficient stock for ${item.product.name}`,
              );
            }
          }
        }

        await tx.cartItem.deleteMany({ where: { cartId } });

        return order;
      });
    } finally {
      await this.cartService.releaseReservedStock(cartId);
    }
  }

  async createGuestOrderFromCart(data: {
    cartId: string;
    email: string;
    firstname: string;
    lastname: string;
    deliveryAddressId: string;
    billingAddressId?: string;
    idempotencyKey?: string;
    deliveryAddressIds?: string[];
  }) {
    const checkout = await this.guestCheckoutService.prepareGuestCheckout(data);

    return this.createOrderFromCart(
      checkout.cartId,
      checkout.customerId,
      data.deliveryAddressId,
      data.billingAddressId,
      data.idempotencyKey,
      data.deliveryAddressIds,
    );
  }
}
