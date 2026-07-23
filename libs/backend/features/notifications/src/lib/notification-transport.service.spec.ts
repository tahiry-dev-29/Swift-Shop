import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationTransportService } from './notification-transport.service';
import { ConfigService } from '@nestjs/config';

function createMockRedis() {
  return {
    publish: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
    subscribe: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
  };
}

describe('NotificationTransportService', () => {
  let transportService: NotificationTransportService;

  beforeEach(() => {
    const mockConfigService = {
      get: vi.fn().mockReturnValue('redis://localhost:6379'),
    } as unknown as ConfigService;
    transportService = new NotificationTransportService(mockConfigService);
    Object.assign(transportService, {
      pubClient: createMockRedis(),
      subClient: createMockRedis(),
    });
  });

  it('should create event stream and publish events to recipient subscriber', async () => {
    const recipient = { customerId: 'cust-100' };
    const observable = transportService.streamForRecipient(recipient);

    let receivedData: unknown = null;
    const subscription = observable.subscribe((event) => {
      receivedData = event.notification;
    });

    transportService.publish({
      recipient,
      notification: {
        id: 'n-stream-1',
        type: 'ORDER',
        channel: 'IN_APP',
        title: 'Streamed Event',
        body: '',
        dateAdd: new Date(),
      },
    });

    expect(receivedData).toMatchObject({
      id: 'n-stream-1',
      title: 'Streamed Event',
    });

    subscription.unsubscribe();
  });
});
