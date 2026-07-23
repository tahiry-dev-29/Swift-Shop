import { ConfigService } from '@nestjs/config';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mocked,
} from 'vitest';
import { PasswordSecurityService } from './password-security.service';
import { sha1PasswordParts } from '../policies/password-policy';

describe('PasswordSecurityService', () => {
  let service: PasswordSecurityService;
  let configServiceMock: Mocked<ConfigService>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    configServiceMock = {
      get: vi.fn((key: string) => {
        if (key === 'HIBP_PASSWORD_CHECK_ENABLED') return 'false';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      }),
    } as unknown as Mocked<ConfigService>;

    service = new PasswordSecurityService(configServiceMock);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword and verifyPassword', () => {
    it('should hash a password and verify it successfully', async () => {
      const password = 'StrongP@ssw0rd!2026';
      const hash = await service.hashPassword(password);
      expect(typeof hash).toBe('string');
      expect(hash).not.toEqual(password);

      const isValid = await service.verifyPassword(hash, password);
      expect(isValid).toBe(true);

      const isInvalid = await service.verifyPassword(hash, 'WrongPassword!123');
      expect(isInvalid).toBe(false);
    });
  });

  describe('hashWithoutPolicy', () => {
    it('should hash password without evaluating policy', async () => {
      const hash = await service.hashWithoutPolicy('any-password');
      expect(typeof hash).toBe('string');
    });
  });

  describe('assertLocalPasswordPolicy', () => {
    it('should throw error for weak passwords failing local policy', () => {
      expect(() => service.assertLocalPasswordPolicy('short')).toThrow();
    });

    it('should pass for strong passwords complying with local policy', () => {
      expect(() =>
        service.assertLocalPasswordPolicy('StrongP@ssw0rd!2026'),
      ).not.toThrow();
    });
  });

  describe('assertPasswordNotPwned', () => {
    it('should throw error if password is found in HIBP breach dataset', async () => {
      configServiceMock.get.mockImplementation((key: string) => {
        if (key === 'HIBP_PASSWORD_CHECK_ENABLED') return 'true';
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      });

      const pass = 'StrongP@ssw0rd!2026';
      const { suffix } = sha1PasswordParts(pass);

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => `${suffix}:25432\n`,
      }) as unknown as typeof fetch;

      await expect(service.assertPasswordPolicy(pass)).rejects.toThrow(
        'Password has appeared in a known data breach',
      );
    });
  });
});
