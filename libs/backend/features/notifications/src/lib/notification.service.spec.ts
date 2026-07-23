import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NotificationFormatter } from './notification.formatter';
import { NotificationQueueService } from './queue/notification-queue.service';
import { PushNotificationService } from './push-notification.service';
import { SmsNotificationService } from './sms-notification.service';
import { NotificationTransportService } from './notification-transport.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let repositoryMock: Mocked<NotificationRepository>;
  let formatter: NotificationFormatter;
  let queueServiceMock: Mocked<NotificationQueueService>;
  let pushServiceMock: Mocked<PushNotificationService>;
  let smsServiceMock: Mocked<SmsNotificationService>;
  let transportServiceMock: Mocked<NotificationTransportService>;

  beforeEach(() => {
    repositoryMock = {
      findPreference: vi.fn(),
      create: vi.fn(),
      findForRecipient: vi.fn(),
      findByIdForRecipient: vi.fn(),
      markAsRead: vi.fn(),
      countUnread: vi.fn(),
      upsertPreference: vi.fn(),
      upsertPushSubscription: vi.fn(),
      markDelivered: vi.fn(),
      markFailed: vi.fn(),
    } as unknown as Mocked<NotificationRepository>;

    queueServiceMock = {
      addDeliveryJob: vi.fn(),
    } as unknown as Mocked<NotificationQueueService>;

    pushServiceMock = {
      send: vi.fn(),
    } as unknown as Mocked<PushNotificationService>;

    smsServiceMock = {
      send: vi.fn(),
    } as unknown as Mocked<SmsNotificationService>;

    transportServiceMock = {
      streamForRecipient: vi.fn(),
      publish: vi.fn(),
    } as unknown as Mocked<NotificationTransportService>;

    formatter = new NotificationFormatter();

    service = new NotificationService(
      repositoryMock,
      formatter,
      queueServiceMock,
      pushServiceMock,
      smsServiceMock,
      transportServiceMock,
    );
  });

  describe('send', () => {
    it('should throw BadRequestException if both customerId and employeeId are set or missing', async () => {
      await expect(
        service.send({
          recipient: { customerId: 'c1', employeeId: 'e1' },
          type: 'ORDER',
          title: 'Title',
          body: 'Body',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create notification record and queue delivery job when enabled', async () => {
      repositoryMock.findPreference.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue({
        id: 'n1',
        customerId: 'c1',
        employeeId: null,
        type: 'ORDER',
        channel: 'IN_APP',
        title: 'Order Confirmed',
        body: 'Your order was placed',
        data: null,
        read: false,
        delivered: false,
        failedAt: null,
        failureReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const result = await service.send({
        recipient: { customerId: 'c1' },
        type: 'ORDER',
        channels: ['IN_APP'],
        title: 'Order Confirmed',
        body: 'Your order was placed',
      });

      expect(repositoryMock.create).toHaveBeenCalled();
      expect(queueServiceMock.addDeliveryJob).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('n1');
    });

    it('should skip notification channel if user preference is disabled', async () => {
      repositoryMock.findPreference.mockResolvedValue({
        id: 'p1',
        enabled: false,
      } as never);

      const result = await service.send({
        recipient: { customerId: 'c1' },
        type: 'PROMO',
        channels: ['SMS'],
        title: 'Promo',
        body: 'Discount',
      });

      expect(repositoryMock.create).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });
  });

  describe('markAsRead', () => {
    it('should throw NotFoundException if notification is not found', async () => {
      repositoryMock.findByIdForRecipient.mockResolvedValue(null);

      await expect(
        service.markAsRead('customer', 'c1', 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should mark notification as read and return updated object', async () => {
      repositoryMock.findByIdForRecipient.mockResolvedValue({
        id: 'n1',
      } as never);
      repositoryMock.markAsRead.mockResolvedValue({
        id: 'n1',
        readAt: new Date(),
        customerId: 'c1',
        employeeId: null,
        type: 'ORDER',
        channel: 'IN_APP',
        title: 'T',
        body: 'B',
        data: null,
        deliveredAt: new Date(),
        failedAt: null,
        failureReason: null,
        dateAdd: new Date(),
      } as never);

      const res = await service.markAsRead('customer', 'c1', 'n1');

      expect(res.readAt).toBeTruthy();
    });
  });

  describe('getUnreadCount', () => {
    it('should return accuracy count from repository', async () => {
      repositoryMock.countUnread.mockResolvedValue(5);

      const count = await service.getUnreadCount('customer', 'c1');

      expect(count).toBe(5);
      expect(repositoryMock.countUnread).toHaveBeenCalledWith({
        customerId: 'c1',
      });
    });
  });

  describe('registerPushSubscription', () => {
    it('should upsert push subscription', async () => {
      repositoryMock.upsertPushSubscription.mockResolvedValue({
        id: 'sub1',
        endpoint: 'https://push.com/123',
        p256dh: 'key',
        auth: 'authSecret',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const res = await service.registerPushSubscription('customer', 'c1', {
        endpoint: 'https://push.com/123',
        p256dh: 'key',
        auth: 'authSecret',
      });

      expect(res.endpoint).toBe('https://push.com/123');
    });
  });
});
