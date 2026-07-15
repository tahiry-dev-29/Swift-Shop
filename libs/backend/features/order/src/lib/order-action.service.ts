import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PrismaService } from '@swift-shop/data-access-prisma';

@Injectable()
export class OrderActionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
  ) {}

  async cancelOrder(orderId: string, employeeId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { state: true, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.state.name === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }
    if (order.state.name === 'SHIPPED' || order.state.name === 'DELIVERED') {
      throw new BadRequestException(
        'Cannot cancel a shipped or delivered order',
      );
    }

    let cancelState = await this.prisma.orderState.findUnique({
      where: { name: 'CANCELLED' },
    });
    if (!cancelState) {
      cancelState = await this.prisma.orderState.create({
        data: { name: 'CANCELLED', color: '#ef4444', position: 99 },
      });
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const orderAfterUpdate = await tx.order.update({
        where: { id: orderId },
        data: { stateId: cancelState.id },
        include: { state: true },
      });

      await tx.orderHistory.create({
        data: {
          orderId,
          stateId: cancelState.id,
          employeeId,
          message: `Order cancelled`,
        },
      });

      // Stock rollback
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { stock: true, combinations: { include: { stock: true } } },
        });

        if (!product) continue;

        const combination = item.combinationId
          ? product.combinations.find((c) => c.id === item.combinationId)
          : null;

        const stock = combination?.stock || product.stock;
        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      return orderAfterUpdate;
    });

    await this.pubSub.publish(`orderStatusChanged:${updatedOrder.id}`, {
      orderStatusChanged: updatedOrder,
    });
    return updatedOrder;
  }

  async requestReturn(
    orderId: string,
    items: { orderItemId: string; quantity: number; reason?: string }[],
    customerNotes?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, state: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.state.name !== 'DELIVERED') {
      throw new BadRequestException(
        'Returns are only allowed for delivered orders',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const newReturn = await tx.return.create({
        data: {
          orderId,
          status: 'PENDING',
          customerNotes,
        },
      });

      for (const reqItem of items) {
        const orderItem = order.items.find((i) => i.id === reqItem.orderItemId);
        if (!orderItem)
          throw new BadRequestException(
            `Order item ${reqItem.orderItemId} not found`,
          );
        if (reqItem.quantity > orderItem.quantity) {
          throw new BadRequestException(
            `Cannot return more than purchased for item ${orderItem.productName}`,
          );
        }

        await tx.returnItem.create({
          data: {
            returnId: newReturn.id,
            orderItemId: reqItem.orderItemId,
            quantity: reqItem.quantity,
            reason: reqItem.reason,
          },
        });
      }

      return tx.return.findUnique({
        where: { id: newReturn.id },
        include: { items: true },
      });
    });
  }
}
