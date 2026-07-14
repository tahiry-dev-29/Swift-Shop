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
      deliveryChat: { findUnique: vi.fn(), create: vi.fn() },
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
      prisma.deliveryChat.findUnique.mockResolvedValue(mockChat);

      const result = await service.getOrCreateSession('ship1');
      expect(result).toEqual(mockChat);
      expect(prisma.deliveryChat.create).not.toHaveBeenCalled();
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
      prisma.deliveryChat.findUnique.mockResolvedValue(null);
      prisma.order.findUnique.mockResolvedValue({
        customerId: 'cust1',
      } as never);
      prisma.deliveryChat.create.mockResolvedValue(mockChat);

      const result = await service.getOrCreateSession('ship1');
      expect(result).toEqual(mockChat);
      expect(prisma.deliveryChat.create).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should throw NotFoundException if chat does not exist', async () => {
      prisma.deliveryChat.findUnique.mockResolvedValue(null);
      await expect(service.getMessages('chat1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return messages if chat exists', async () => {
      prisma.deliveryChat.findUnique.mockResolvedValue({
        id: 'chat1',
      } as never);
      prisma.deliveryChatMessage.findMany.mockResolvedValue([
        { id: 'msg1' },
      ] as never);

      const result = await service.getMessages('chat1');
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
