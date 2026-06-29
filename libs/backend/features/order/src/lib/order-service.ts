import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { CartService } from '@dima-new/backend/cart';
import { OrderExportService } from './order-export.service';
import { OrderInvoiceService } from './order-invoice.service';

const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly orderExportService: OrderExportService,
    private readonly orderInvoiceService: OrderInvoiceService,
  ) {}

  async getMyOrders(customerId: string) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: {
        state: true,
        items: true,
        addresses: true,
      },
      orderBy: { dateAdd: 'desc' },
    });
  }

  async getOrder(orderId: string, customerId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        state: true,
        items: true,
        addresses: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (customerId && order.customerId !== customerId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrderStates() {
    return this.prisma.orderState.findMany({ orderBy: { position: 'asc' } });
  }

  async updateOrderStatus(
    orderId: string,
    stateId: string,
    employeeId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { state: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const newState = await this.prisma.orderState.findUnique({
      where: { id: stateId },
    });
    if (!newState) throw new NotFoundException('Order state not found');

    this.assertTransitionAllowed(order.state.name, newState.name);

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { stateId },
        include: { state: true },
      });

      await tx.orderHistory.create({
        data: {
          orderId,
          stateId,
          employeeId,
          message: `Status changed from ${order.state.name} to ${newState.name}`,
        },
      });

      return updatedOrder;
    });
  }

  private assertTransitionAllowed(currentState: string, nextState: string) {
    if (currentState === nextState) {
      return;
    }

    const allowedStates = ALLOWED_ORDER_TRANSITIONS[currentState] ?? [];
    if (!allowedStates.includes(nextState)) {
      throw new BadRequestException(
        `Illegal order transition from ${currentState} to ${nextState}`,
      );
    }
  }

  async generateInvoicePDF(orderId: string) {
    return this.orderInvoiceService.generateInvoicePDF(orderId);
  }

  async reorderToCart(orderId: string, customerId: string) {
    const order = await this.getOrder(orderId, customerId);
    const cart = await this.cartService.getOrCreateCart(customerId);

    for (const item of order.items) {
      await this.cartService.addToCart(
        cart.id,
        item.productId,
        item.quantity,
        item.combinationId ?? undefined,
      );
    }

    return this.cartService.getCartWithTotals(cart.id);
  }

  async exportOrders(customerId: string, format: 'csv' | 'xlsx' = 'csv') {
    return this.orderExportService.exportOrders(customerId, format);
  }

  async addOrderNote(
    orderId: string,
    content: string,
    isInternal = false,
    employeeId?: string,
    customerId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.orderNote.create({
      data: {
        orderId,
        content,
        isInternal,
        employeeId,
        customerId,
      },
    });
  }
}
