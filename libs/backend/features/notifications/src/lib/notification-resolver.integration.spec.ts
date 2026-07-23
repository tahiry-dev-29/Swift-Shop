import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { NotificationResolver } from './notification.resolver';
import { NotificationSseController } from './notification-sse.controller';
import { NotificationService } from './notification.service';
import { NotificationTransportService } from './notification-transport.service';
import { AuthUser } from '@swift-shop/backend/auth';
import { of, firstValueFrom } from 'rxjs';

describe('Notification Resolver & SSE Controller Integration Tests', () => {
  let resolver: NotificationResolver;
  let sseController: NotificationSseController;

  let notificationServiceMock: Mocked<NotificationService>;
  let transportServiceMock: Mocked<NotificationTransportService>;

  const mockUser: AuthUser = {
    id: 'user-1',
    type: 'customer',
    email: 'test@user.com',
  };

  beforeEach(() => {
    notificationServiceMock = {
      listForUser: vi.fn(),
      getUnreadCount: vi.fn(),
      send: vi.fn(),
      markAsRead: vi.fn(),
      updatePreference: vi.fn(),
      registerPushSubscription: vi.fn(),
      streamForUser: vi.fn(),
      recipientFromActor: vi.fn(),
    } as unknown as Mocked<NotificationService>;

    transportServiceMock = {
      streamForRecipient: vi.fn(),
    } as unknown as Mocked<NotificationTransportService>;

    resolver = new NotificationResolver(
      notificationServiceMock,
      transportServiceMock,
    );
    sseController = new NotificationSseController(notificationServiceMock);
  });

  describe('myNotifications Query', () => {
    it('should query notifications for current logged in user', async () => {
      notificationServiceMock.listForUser.mockResolvedValue([
        { id: 'n1', title: 'Welcome' } as never,
      ]);

      const res = await resolver.myNotifications(mockUser, 10, false);

      expect(res).toHaveLength(1);
      expect(notificationServiceMock.listForUser).toHaveBeenCalledWith(
        'customer',
        'user-1',
        { limit: 10, unreadOnly: false },
      );
    });
  });

  describe('notificationUnreadCount Query', () => {
    it('should return accurate unread count object', async () => {
      notificationServiceMock.getUnreadCount.mockResolvedValue(3);

      const res = await resolver.notificationUnreadCount(mockUser);

      expect(res).toEqual({ count: 3 });
    });
  });

  describe('sendNotification Mutation', () => {
    it('should dispatch notification creation', async () => {
      const input = {
        recipient: { customerId: 'c1' },
        type: 'ORDER',
        title: 'Order Status',
        body: 'Shipped',
      };
      notificationServiceMock.send.mockResolvedValue([
        { id: 'n1', title: 'Order Status' } as never,
      ]);

      const res = await resolver.sendNotification(input);

      expect(res).toHaveLength(1);
      expect(notificationServiceMock.send).toHaveBeenCalledWith(input);
    });
  });

  describe('markNotificationAsRead Mutation', () => {
    it('should mark notification read for current user', async () => {
      notificationServiceMock.markAsRead.mockResolvedValue({
        id: 'n1',
        read: true,
      } as never);

      const res = await resolver.markNotificationAsRead(mockUser, 'n1');

      expect(res.read).toBe(true);
      expect(notificationServiceMock.markAsRead).toHaveBeenCalledWith(
        'customer',
        'user-1',
        'n1',
      );
    });
  });

  describe('SSE Controller Stream Endpoint', () => {
    it('should map notification stream into SSE message events', async () => {
      notificationServiceMock.streamForUser.mockReturnValue(
        of({
          recipient: { customerId: 'user-1' },
          notification: { id: 'n1', title: 'SSE Title' } as never,
        }),
      );

      const stream$ = sseController.stream(mockUser);
      const event = await firstValueFrom(stream$);

      expect(event.type).toBe('notification');
      expect(event.data).toEqual({ id: 'n1', title: 'SSE Title' });
    });
  });
});
