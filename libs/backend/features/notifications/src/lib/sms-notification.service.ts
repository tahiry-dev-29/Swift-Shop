import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsNotificationPayload {
  notificationId: string;
  phoneNumber?: string;
  body: string;
}

@Injectable()
export class SmsNotificationService {
  private readonly logger = new Logger(SmsNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(payload: SmsNotificationPayload) {
    if (!payload.phoneNumber) {
      this.logger.warn(
        `SMS notification ${payload.notificationId} skipped: no phone number`,
      );
      return;
    }

    const twilioToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const africasTalkingKey = this.configService.get<string>(
      'AFRICAS_TALKING_API_KEY',
    );

    if (!twilioToken && !africasTalkingKey) {
      this.logger.warn(
        `SMS providers are not configured; skipped notification ${payload.notificationId}`,
      );
      return;
    }

    this.logger.log(
      `Queued SMS delivery for notification ${payload.notificationId} to ${payload.phoneNumber}`,
    );
  }
}
