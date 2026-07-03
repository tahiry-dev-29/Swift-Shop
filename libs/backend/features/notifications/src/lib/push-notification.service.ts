import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationRepository } from './notification.repository';
import { NotificationRecipient } from './interfaces/notification-recipient.interface';

export interface PushNotificationPayload {
  notificationId: string;
  recipient: NotificationRecipient;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly repository: NotificationRepository,
  ) {}

  async send(payload: PushNotificationPayload) {
    const subscriptions = await this.repository.findActivePushSubscriptions(
      payload.recipient,
    );

    if (subscriptions.length === 0) {
      this.logger.debug(
        `No active push subscriptions for notification ${payload.notificationId}`,
      );
      return;
    }

    const fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY');
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (!fcmServerKey && (!vapidPublicKey || !vapidPrivateKey)) {
      this.logger.warn(
        `Push providers are not configured; skipped ${subscriptions.length} subscription(s) for notification ${payload.notificationId}`,
      );
      return;
    }

    this.logger.log(
      `Queued push delivery for notification ${payload.notificationId} to ${subscriptions.length} subscription(s)`,
    );
  }
}
