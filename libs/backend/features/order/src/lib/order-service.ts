import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';

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
  constructor(private readonly prisma: PrismaService) {}

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
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');

    let invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
    });

    if (!invoice) {
      const invoiceNumber = `INV-${order.reference}`;
      invoice = await this.prisma.invoice.create({
        data: {
          orderId,
          invoiceNumber,
          pdfStorageRef: `uploads/invoices/${invoiceNumber}.pdf`,
        },
      });
    }

    return invoice;
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
