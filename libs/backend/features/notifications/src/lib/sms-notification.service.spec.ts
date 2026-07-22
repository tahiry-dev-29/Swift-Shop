import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SmsNotificationService } from './sms-notification.service';
import { ConfigService } from '@nestjs/config';

describe('SmsNotificationService', () => {
  let service: SmsNotificationService;
  let configServiceMock: Mocked<ConfigService>;

  beforeEach(() => {
    configServiceMock = {
      get: vi.fn(),
    } as unknown as Mocked<ConfigService>;

    service = new SmsNotificationService(configServiceMock);
  });

  it('should skip SMS when no phone number is provided in payload', async () => {
    await service.send({
      notificationId: 'n1',
      body: 'SMS Body',
    });

    expect(configServiceMock.get).not.toHaveBeenCalled();
  });

  it('should process SMS delivery when Twilio or AfricasTalking token is configured', async () => {
    configServiceMock.get.mockImplementation((key: string) => {
      if (key === 'TWILIO_AUTH_TOKEN') return 'twilio_secret';
      return null;
    });

    await service.send({
      notificationId: 'n1',
      phoneNumber: '+1234567890',
      body: 'Your verification code is 1234',
    });

    expect(configServiceMock.get).toHaveBeenCalledWith('TWILIO_AUTH_TOKEN');
  });
});
