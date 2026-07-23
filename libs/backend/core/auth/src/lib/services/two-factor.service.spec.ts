import { describe, it, expect, beforeEach } from 'vitest';
import { TwoFactorService } from './two-factor.service';

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  beforeEach(() => {
    service = new TwoFactorService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a 2FA secret and otpauth URI', () => {
      const result = service.generateSecret('admin@shop.com');
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('otpauthUrl');
      expect(typeof result.secret).toBe('string');
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(result.otpauthUrl).toContain('admin%40shop.com');
    });
  });

  describe('generateQrCodeDataURL', () => {
    it('should generate a QR code data URL from otpauth URL', async () => {
      const otpUrl =
        'otpauth://totp/Store%20Admin:admin@shop.com?secret=JBSWY3DPEHPK3PXP&issuer=Store%20Admin';
      const dataUrl = await service.generateQrCodeDataURL(otpUrl);
      expect(dataUrl).toContain('data:image/png;base64,');
    });
  });

  describe('verifyToken', () => {
    it('should return false for invalid 2FA token', () => {
      const { secret } = service.generateSecret('admin@shop.com');
      const result = service.verifyToken(secret, '000000');
      expect(result).toBe(false);
    });
  });
});
