import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { SmtpService } from '../infrastructure/smtp/smtp.service';
import { AuthMailService } from './auth-mail.service';

describe('AuthMailService', () => {
  let service: AuthMailService;
  let smtpMock: Mocked<SmtpService>;
  let configMock: Mocked<ConfigService>;

  beforeEach(() => {
    smtpMock = {
      sendMail: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<SmtpService>;

    configMock = {
      get: vi.fn((key: string) => {
        if (key === 'SMTP_FROM') return 'no-reply@swiftshop.com';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    } as unknown as Mocked<ConfigService>;

    service = new AuthMailService(smtpMock, configMock);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('send', () => {
    it('should call smtpService with correct payload when SMTP_FROM is configured', async () => {
      await service.send({
        to: 'user@test.com',
        subject: 'Test Subject',
        text: 'Test Text',
      });

      expect(smtpMock.sendMail).toHaveBeenCalledWith({
        from: 'no-reply@swiftshop.com',
        to: 'user@test.com',
        subject: 'Test Subject',
        text: 'Test Text',
        html: undefined,
      });
    });

    it('should throw error in production if SMTP_FROM is missing', async () => {
      configMock.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM') return undefined;
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      });

      await expect(
        service.send({
          to: 'user@test.com',
          subject: 'Test',
          text: 'Test',
        }),
      ).rejects.toThrow('SMTP_FROM is not configured');
    });
  });

  describe('email methods', () => {
    it('sendCustomerMagicLink should send magic link email', async () => {
      await service.sendCustomerMagicLink(
        'cust@test.com',
        'https://magic.link',
      );
      expect(smtpMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'cust@test.com',
          subject: 'Votre lien de connexion',
        }),
      );
    });

    it('sendAccountLockoutAlert should send security alert', async () => {
      await service.sendAccountLockoutAlert({
        email: 'emp@test.com',
        accountType: 'employee',
        lockedUntil: new Date('2026-07-22T15:00:00Z'),
      });
      expect(smtpMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'emp@test.com',
          subject: 'Alerte sécurité : compte temporairement verrouillé',
        }),
      );
    });

    it('sendPasswordResetLink should send reset link email', async () => {
      await service.sendPasswordResetLink('emp@test.com', 'https://reset.link');
      expect(smtpMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'emp@test.com',
          subject: 'Réinitialisation de votre mot de passe',
        }),
      );
    });

    it('sendWelcome should send welcome email', async () => {
      await service.sendWelcome('cust@test.com', 'Alice');
      expect(smtpMock.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'cust@test.com',
          subject: 'Bienvenue !',
        }),
      );
    });
  });
});
