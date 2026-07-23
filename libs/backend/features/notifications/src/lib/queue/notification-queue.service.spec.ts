import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationProcessor } from './notification.processor';
import { NotificationService } from '../notification.service';
import { Queue, Job } from 'bullmq';

describe('Notification Queue & Processor Tests', () => {
  let queueService: NotificationQueueService;
  let queueMock: Mocked<Queue>;
  let processor: NotificationProcessor;
  let notificationServiceMock: Mocked<NotificationService>;

  beforeEach(() => {
    queueMock = {
      add: vi.fn(),
    } as unknown as Mocked<Queue>;

    notificationServiceMock = {
      dispatchDeliveryJob: vi.fn(),
    } as unknown as Mocked<NotificationService>;

    queueService = new NotificationQueueService(queueMock);
    processor = new NotificationProcessor(notificationServiceMock);
  });

  describe('NotificationQueueService', () => {
    it('should add delivery job to BullMQ queue with appropriate priority', async () => {
      await queueService.addDeliveryJob({
        notificationId: 'n1',
        channel: 'IN_APP',
        recipient: { customerId: 'c1' },
        title: 'Title',
        body: 'Body',
      });

      expect(queueMock.add).toHaveBeenCalledWith(
        'deliver-notification',
        expect.objectContaining({ notificationId: 'n1' }),
        expect.any(Object),
      );
    });
  });

  describe('NotificationProcessor', () => {
    it('should dispatch delivery job when job name is deliver', async () => {
      const mockJob = {
        name: 'deliver-notification',
        data: {
          notificationId: 'n1',
          channel: 'IN_APP',
          recipient: { customerId: 'c1' },
          title: 'Title',
          body: 'Body',
        },
      } as Job;

      await processor.process(mockJob);

      expect(notificationServiceMock.dispatchDeliveryJob).toHaveBeenCalledWith(
        mockJob.data,
      );
    });

    it('should throw error when job name is unknown', async () => {
      const mockJob = {
        name: 'unknown_job',
        data: {},
      } as Job;

      await expect(processor.process(mockJob)).rejects.toThrow(
        'Unknown notification job: unknown_job',
      );
    });
  });
});
