import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import { Prisma } from '@dima-new/prisma-client';
import { NotificationRecipient } from './interfaces/notification-recipient.interface';
import { PushSubscriptionInput } from './dto';

export interface CreateNotificationData {
  recipient: NotificationRecipient;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: Prisma.InputJsonValue;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateNotificationData) {
    return this.prisma.notification.create({
      data: {
        customerId: data.recipient.customerId,
        employeeId: data.recipient.employeeId,
        type: data.type,
        channel: data.channel,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });
  }

  findForRecipient(
    recipient: NotificationRecipient,
    options: { limit: number; unreadOnly?: boolean },
  ) {
    return this.prisma.notification.findMany({
      where: {
        ...this.recipientWhere(recipient),
        readAt: options.unreadOnly ? null : undefined,
      },
      orderBy: { dateAdd: 'desc' },
      take: options.limit,
    });
  }

  findByIdForRecipient(id: string, recipient: NotificationRecipient) {
    return this.prisma.notification.findFirst({
      where: {
        id,
        ...this.recipientWhere(recipient),
      },
    });
  }

  markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  countUnread(recipient: NotificationRecipient) {
    return this.prisma.notification.count({
      where: {
        ...this.recipientWhere(recipient),
        readAt: null,
      },
    });
  }

  findPreference(
    recipient: NotificationRecipient,
    type: string,
    channel: string,
  ) {
    return this.prisma.notificationPreference.findFirst({
      where: {
        ...this.recipientWhere(recipient),
        type,
        channel,
      },
    });
  }

  upsertPreference(
    recipient: NotificationRecipient,
    input: { type: string; channel: string; enabled: boolean },
  ) {
    const data = {
      customerId: recipient.customerId,
      employeeId: recipient.employeeId,
      type: input.type,
      channel: input.channel,
      enabled: input.enabled,
    };

    if (recipient.customerId) {
      return this.prisma.notificationPreference.upsert({
        where: {
          customerId_type_channel: {
            customerId: recipient.customerId,
            type: input.type,
            channel: input.channel,
          },
        },
        create: data,
        update: { enabled: input.enabled },
      });
    }

    return this.prisma.notificationPreference.upsert({
      where: {
        employeeId_type_channel: {
          employeeId: recipient.employeeId ?? '',
          type: input.type,
          channel: input.channel,
        },
      },
      create: data,
      update: { enabled: input.enabled },
    });
  }

  upsertPushSubscription(
    recipient: NotificationRecipient,
    input: PushSubscriptionInput,
  ) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        customerId: recipient.customerId,
        employeeId: recipient.employeeId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        platform: input.platform,
        provider: input.provider ?? 'WEB_PUSH',
      },
      update: {
        customerId: recipient.customerId,
        employeeId: recipient.employeeId,
        p256dh: input.p256dh,
        auth: input.auth,
        platform: input.platform,
        provider: input.provider ?? 'WEB_PUSH',
        active: true,
      },
    });
  }

  findActivePushSubscriptions(recipient: NotificationRecipient) {
    return this.prisma.pushSubscription.findMany({
      where: {
        ...this.recipientWhere(recipient),
        active: true,
      },
    });
  }

  markDelivered(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        deliveredAt: new Date(),
        failedAt: null,
        failureReason: null,
      },
    });
  }

  markFailed(id: string, failureReason: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        failedAt: new Date(),
        failureReason,
      },
    });
  }

  private recipientWhere(recipient: NotificationRecipient) {
    if (recipient.customerId) {
      return { customerId: recipient.customerId };
    }

    return { employeeId: recipient.employeeId };
  }
}
