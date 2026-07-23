import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { PushNotificationService } from './push-notification.service';
import { ConfigService } from '@nestjs/config';
import { NotificationRepository } from './notification.repository';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let configServiceMock: Mocked<ConfigService>;
  let repositoryMock: Mocked<NotificationRepository>;

  beforeEach(() => {
    configServiceMock = {
      get: vi.fn(),
    } as unknown as Mocked<ConfigService>;

    repositoryMock = {
      findActivePushSubscriptions: vi.fn(),
    } as unknown as Mocked<NotificationRepository>;

    service = new PushNotificationService(configServiceMock, repositoryMock);
  });

  it('should return early when no active push subscriptions exist for recipient', async () => {
    repositoryMock.findActivePushSubscriptions.mockResolvedValue([]);

    await service.send({
      notificationId: 'n1',
      recipient: { customerId: 'c1' },
      title: 'Title',
      body: 'Body',
    });

    expect(repositoryMock.findActivePushSubscriptions).toHaveBeenCalledWith({
      customerId: 'c1',
    });
  });

  it('should handle configured FCM / VAPID push subscriptions', async () => {
    repositoryMock.findActivePushSubscriptions.mockResolvedValue([
      { id: 'sub1', endpoint: 'https://push.com' } as never,
    ]);
    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'FCM_SERVER_KEY') return 'fcm_key_123';
      return null;
    });

    await service.send({
      notificationId: 'n1',
      recipient: { customerId: 'c1' },
      title: 'Title',
      body: 'Body',
    });

    expect(configServiceMock.get).toHaveBeenCalledWith('FCM_SERVER_KEY');
  });
});
