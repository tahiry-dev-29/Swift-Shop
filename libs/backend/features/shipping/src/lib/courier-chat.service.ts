import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { Logger } from '@nestjs/common';

@Injectable()
export class CourierChatService {
  private readonly logger = new Logger(CourierChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSession(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${shipmentId} not found`);
    }

    let chat = await this.prisma.deliveryChat.findUnique({
      where: { shipmentId },
    });

    if (!chat) {
      chat = await this.prisma.deliveryChat.create({
        data: {
          shipmentId,
          courierId: shipment.carrierId,
          customerId: await this.getCustomerIdForShipment(shipment.orderId),
        },
      });
    }

    return chat;
  }

  async getMessages(chatId: string) {
    const chat = await this.prisma.deliveryChat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException(`Chat session ${chatId} not found`);
    }

    return this.prisma.deliveryChatMessage.findMany({
      where: { chatId },
      orderBy: { dateAdd: 'asc' },
    });
  }

  async sendMessage(
    chatId: string,
    senderType: string,
    senderId: string | null,
    content: string,
  ) {
    const chat = await this.prisma.deliveryChat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException(`Chat session ${chatId} not found`);
    }

    const message = await this.prisma.deliveryChatMessage.create({
      data: {
        chatId,
        senderType,
        senderId,
        content,
      },
    });

    if (senderType === 'CUSTOMER' && chat.courierId) {
      this.logger.log(
        `Push notification: Send to courier ${chat.courierId} - New message from customer: ${content}`,
      );
    }

    return message;
  }

  private async getCustomerIdForShipment(
    orderId: string,
  ): Promise<string | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { customerId: true },
    });
    return order?.customerId ?? null;
  }
}
