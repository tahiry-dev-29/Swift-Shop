import { Injectable } from '@nestjs/common';
import {
  NotificationPreferenceType,
  NotificationType,
  PushSubscriptionType,
} from './dto';

interface NotificationRecord {
  id: string;
  customerId?: string | null;
  employeeId?: string | null;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: unknown;
  readAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  failureReason?: string | null;
  dateAdd: Date;
}

interface NotificationPreferenceRecord {
  id: string;
  customerId?: string | null;
  employeeId?: string | null;
  type: string;
  channel: string;
  enabled: boolean;
}

interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  platform?: string | null;
  provider: string;
  active: boolean;
}

@Injectable()
export class NotificationFormatter {
  toNotificationType(record: NotificationRecord): NotificationType {
    return {
      id: record.id,
      customerId: record.customerId ?? undefined,
      employeeId: record.employeeId ?? undefined,
      type: record.type,
      channel: record.channel,
      title: record.title,
      body: record.body,
      data: record.data ? JSON.stringify(record.data) : undefined,
      readAt: record.readAt ?? undefined,
      deliveredAt: record.deliveredAt ?? undefined,
      failedAt: record.failedAt ?? undefined,
      failureReason: record.failureReason ?? undefined,
      dateAdd: record.dateAdd,
    };
  }

  toPreferenceType(
    record: NotificationPreferenceRecord,
  ): NotificationPreferenceType {
    return {
      id: record.id,
      customerId: record.customerId ?? undefined,
      employeeId: record.employeeId ?? undefined,
      type: record.type,
      channel: record.channel,
      enabled: record.enabled,
    };
  }

  toPushSubscriptionType(record: PushSubscriptionRecord): PushSubscriptionType {
    return {
      id: record.id,
      endpoint: record.endpoint,
      platform: record.platform ?? undefined,
      provider: record.provider,
      active: record.active,
    };
  }
}
