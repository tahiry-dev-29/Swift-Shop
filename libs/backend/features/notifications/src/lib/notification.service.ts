import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@dima-new/prisma-client';
import {
  NotificationPreferenceInput,
  PushSubscriptionInput,
  SendNotificationInput,
} from './dto';
import { NotificationFormatter } from './notification.formatter';
import { NotificationRepository } from './notification.repository';
import {
  NotificationActorType,
  NotificationRecipient,
} from './interfaces/notification-recipient.interface';
import {
  NotificationDeliveryJobData,
  NotificationQueueService,
} from './queue/notification-queue.service';
import { PushNotificationService } from './push-notification.service';
import { SmsNotificationService } from './sms-notification.service';
import { NotificationTransportService } from './notification-transport.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly formatter: NotificationFormatter,
    private readonly queueService: NotificationQueueService,
    private readonly pushService: PushNotificationService,
    private readonly smsService: SmsNotificationService,
    private readonly transportService: NotificationTransportService,
  ) {}

  async send(input: SendNotificationInput) {
    const recipient = this.assertRecipient(input.recipient);
    const rawChannels = input.channels?.length ? input.channels : ['IN_APP'];
    const channels = Array.from(new Set(rawChannels));
    const data = this.parseJson(input.dataJson);
    const created = [];

    for (const channel of channels) {
      const preference = await this.repository.findPreference(
        recipient,
        input.type,
        channel,
      );

      if (preference && !preference.enabled) {
        continue;
      }

      const notification = await this.repository.create({
        recipient,
        type: input.type,
        channel,
        title: input.title,
        body: input.body,
        data,
      });

      await this.queueService.addDeliveryJob({
        notificationId: notification.id,
        channel,
        recipient,
        title: input.title,
        body: input.body,
        data: data as Record<string, unknown> | undefined,
        phoneNumber: input.phoneNumber,
      });

      created.push(notification);
    }

    return created.map((notification) =>
      this.formatter.toNotificationType(notification),
    );
  }

  async listForUser(
    actorType: NotificationActorType,
    actorId: string,
    options: { limit?: number; unreadOnly?: boolean },
  ) {
    const recipient = this.recipientFromActor(actorType, actorId);
    const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
    const notifications = await this.repository.findForRecipient(recipient, {
      limit,
      unreadOnly: options.unreadOnly,
    });

    return notifications.map((notification) =>
      this.formatter.toNotificationType(notification),
    );
  }

  async markAsRead(
    actorType: NotificationActorType,
    actorId: string,
    id: string,
  ) {
    const recipient = this.recipientFromActor(actorType, actorId);
    const notification = await this.repository.findByIdForRecipient(
      id,
      recipient,
    );

    if (!notification) {
      throw new NotFoundException(`Notification #${id} not found`);
    }

    const updated = await this.repository.markAsRead(id);
    return this.formatter.toNotificationType(updated);
  }

  async getUnreadCount(actorType: NotificationActorType, actorId: string) {
    return this.repository.countUnread(
      this.recipientFromActor(actorType, actorId),
    );
  }

  async updatePreference(
    actorType: NotificationActorType,
    actorId: string,
    input: NotificationPreferenceInput,
  ) {
    const preference = await this.repository.upsertPreference(
      this.recipientFromActor(actorType, actorId),
      input,
    );

    return this.formatter.toPreferenceType(preference);
  }

  async registerPushSubscription(
    actorType: NotificationActorType,
    actorId: string,
    input: PushSubscriptionInput,
  ) {
    const subscription = await this.repository.upsertPushSubscription(
      this.recipientFromActor(actorType, actorId),
      input,
    );

    return this.formatter.toPushSubscriptionType(subscription);
  }

  streamForUser(actorType: NotificationActorType, actorId: string) {
    return this.transportService.streamForRecipient(
      this.recipientFromActor(actorType, actorId),
    );
  }

  async dispatchDeliveryJob(data: NotificationDeliveryJobData) {
    try {
      if (data.channel === 'IN_APP') {
        const notification = await this.repository.markDelivered(
          data.notificationId,
        );
        const formatted = this.formatter.toNotificationType(notification);
        this.transportService.publish({
          recipient: data.recipient,
          notification: formatted,
        });
        return formatted;
      }

      if (data.channel === 'PUSH') {
        await this.pushService.send(data);
      } else if (data.channel === 'SMS') {
        await this.smsService.send(data);
      } else {
        throw new BadRequestException(
          `Unsupported notification channel: ${data.channel}`,
        );
      }

      const notification = await this.repository.markDelivered(
        data.notificationId,
      );
      return this.formatter.toNotificationType(notification);
    } catch (error) {
      await this.repository.markFailed(
        data.notificationId,
        error instanceof Error ? error.message : 'Unknown delivery failure',
      );
      throw error;
    }
  }

  recipientFromActor(
    actorType: NotificationActorType,
    actorId: string,
  ): NotificationRecipient {
    return actorType === 'customer'
      ? { customerId: actorId }
      : { employeeId: actorId };
  }

  private assertRecipient(recipient: NotificationRecipient) {
    if (Boolean(recipient.customerId) === Boolean(recipient.employeeId)) {
      throw new BadRequestException(
        'Provide exactly one notification recipient',
      );
    }

    return recipient;
  }

  private parseJson(dataJson?: string): Prisma.InputJsonValue | undefined {
    if (!dataJson) {
      return undefined;
    }

    try {
      return JSON.parse(dataJson) as Prisma.InputJsonValue;
    } catch {
      throw new BadRequestException('dataJson must be valid JSON');
    }
  }
}
