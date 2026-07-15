import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { CourierChatService } from './courier-chat.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { NotFoundException } from '@nestjs/common';

describe('CourierChatService', () => {
  let service: CourierChatService;
  let prisma: Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      shipment: { findUnique: vi.fn() },
      deliveryChat: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
      deliveryChatMessage: { findMany: vi.fn(), create: vi.fn() },
      order: { findUnique: vi.fn() },
    } as unknown as Mocked<PrismaService>;

    service = new CourierChatService(prisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateSession', () => {
    it('should throw NotFoundException if shipment does not exist', async () => {
      prisma.shipment.findUnique.mockResolvedValue(null);
      await expect(service.getOrCreateSession('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return existing chat session if it exists', async () => {
      const mockShipment = {
        id: 'ship1',
        carrierId: 'c1',
        orderId: 'o1',
      } as never;
      const mockChat = {
        id: 'chat1',
        shipmentId: 'ship1',
        courierId: 'c1',
      } as never;

      prisma.shipment.findUnique.mockResolvedValue(mockShipment);
      prisma.deliveryChat.upsert.mockResolvedValue(mockChat);

      const result = await service.getOrCreateSession('ship1');
      expect(result).toEqual(mockChat);
      expect(prisma.deliveryChat.upsert).toHaveBeenCalledWith({
        where: { shipmentId: 'ship1' },
        update: {},
        create: expect.objectContaining({
          shipmentId: 'ship1',
          courierId: 'c1',
        }),
      });
    });

    it('should create and return new chat session if none exists', async () => {
      const mockShipment = {
        id: 'ship1',
        carrierId: 'c1',
        orderId: 'o1',
      } as never;
      const mockChat = {
        id: 'chat1',
        shipmentId: 'ship1',
        courierId: 'c1',
      } as never;

      prisma.shipment.findUnique.mockResolvedValue(mockShipment);
      prisma.order.findUnique.mockResolvedValue({
        customerId: 'cust1',
      } as never);
      prisma.deliveryChat.upsert.mockResolvedValue(mockChat);

      const result = await service.getOrCreateSession('ship1');
      expect(result).toEqual(mockChat);
      expect(prisma.deliveryChat.upsert).toHaveBeenCalledWith({
        where: { shipmentId: 'ship1' },
        update: {},
        create: expect.objectContaining({
          shipmentId: 'ship1',
          courierId: 'c1',
          customerId: 'cust1',
        }),
      });
    });
  });

  describe('getMessages', () => {
    it('should throw NotFoundException if chat does not exist', async () => {
      prisma.deliveryChat.findUnique.mockResolvedValue(null);
      await expect(
        service.getMessages('chat1', 'cust1', 'customer'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      prisma.deliveryChat.findUnique.mockResolvedValue({
        id: 'chat1',
        customerId: 'cust1',
        courierId: 'c1',
      } as never);

      await expect(
        service.getMessages('chat1', 'otherUser', 'customer'),
      ).rejects.toThrow('You are not a participant');
    });

    it('should return messages if chat exists and user is participant', async () => {
      prisma.deliveryChat.findUnique.mockResolvedValue({
        id: 'chat1',
        customerId: 'cust1',
        courierId: 'c1',
      } as never);
      prisma.deliveryChatMessage.findMany.mockResolvedValue([
        { id: 'msg1' },
      ] as never);

      const result = await service.getMessages('chat1', 'cust1', 'customer');
      expect(result).toEqual([{ id: 'msg1' }]);
    });
  });

  describe('sendMessage', () => {
    it('should throw NotFoundException if chat does not exist', async () => {
      prisma.deliveryChat.findUnique.mockResolvedValue(null);
      await expect(
        service.sendMessage('chat1', 'CUSTOMER', 'cust1', 'hello'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return message', async () => {
      const mockChat = { id: 'chat1', courierId: 'c1' } as never;
      const mockMsg = { id: 'msg1', content: 'hello' } as never;

      prisma.deliveryChat.findUnique.mockResolvedValue(mockChat);
      prisma.deliveryChatMessage.create.mockResolvedValue(mockMsg);

      const result = await service.sendMessage(
        'chat1',
        'CUSTOMER',
        'cust1',
        'hello',
      );
      expect(result).toEqual(mockMsg);
    });
  });
});
