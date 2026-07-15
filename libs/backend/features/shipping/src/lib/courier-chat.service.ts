import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

    return this.prisma.deliveryChat.upsert({
      where: { shipmentId },
      update: {},
      create: {
        shipmentId,
        courierId: shipment.carrierId,
        customerId: await this.getCustomerIdForShipment(shipment.orderId),
      },
    });
  }

  async getChatById(chatId: string) {
    const chat = await this.prisma.deliveryChat.findUnique({
      where: { id: chatId },
    });
    if (!chat) {
      throw new NotFoundException(`Chat session ${chatId} not found`);
    }
    return chat;
  }

  assertChatMember(
    chat: { customerId: string | null; courierId: string | null },
    userId: string,
    userType: string,
  ) {
    const isCustomer = userType === 'customer' && chat.customerId === userId;
    const isCourier = userType === 'employee' && chat.courierId === userId;
    if (!isCustomer && !isCourier) {
      throw new ForbiddenException(
        'You are not a participant of this chat session',
      );
    }
  }

  async getMessages(chatId: string, userId: string, userType: string) {
    const chat = await this.getChatById(chatId);
    this.assertChatMember(chat, userId, userType);

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
