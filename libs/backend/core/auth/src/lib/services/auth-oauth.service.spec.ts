import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@swift-shop/data-access-prisma';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type Mocked,
} from 'vitest';
import { AuthOAuthService } from './auth-oauth.service';
import { PasswordSecurityService } from './password-security.service';

describe('AuthOAuthService', () => {
  let service: AuthOAuthService;
  let prismaMock: {
    oAuthAccount: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    customerGroup: {
      findFirst: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let configServiceMock: Mocked<ConfigService>;
  let passwordSecurityMock: Mocked<PasswordSecurityService>;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    prismaMock = {
      oAuthAccount: {
        findUnique: vi.fn(),
      },
      customerGroup: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn(),
    };

    configServiceMock = {
      getOrThrow: vi.fn((key: string) => {
        if (key.includes('GOOGLE_CLIENT_ID')) return 'google-client-id';
        if (key.includes('GOOGLE_CLIENT_SECRET')) return 'google-secret';
        if (key.includes('FACEBOOK_CLIENT_ID')) return 'facebook-client-id';
        if (key.includes('FACEBOOK_CLIENT_SECRET')) return 'facebook-secret';
        return 'test-secret';
      }),
    } as unknown as Mocked<ConfigService>;

    passwordSecurityMock = {
      hashWithoutPolicy: vi.fn().mockResolvedValue('hashed-random-pass'),
    } as unknown as Mocked<PasswordSecurityService>;

    service = new AuthOAuthService(
      prismaMock as unknown as PrismaService,
      configServiceMock,
      passwordSecurityMock,
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOAuthAuthorizationUrl', () => {
    it('should build valid Google OAuth authorization URL', async () => {
      const url = await service.createOAuthAuthorizationUrl(
        'google',
        'https://app.com/callback',
        'challenge123',
        'state123',
      );
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=google-client-id');
      expect(url).toContain('code_challenge=challenge123');
    });

    it('should build valid Facebook OAuth authorization URL', async () => {
      const url = await service.createOAuthAuthorizationUrl(
        'facebook',
        'https://app.com/callback',
        'challenge123',
        'state123',
      );
      expect(url).toContain('https://www.facebook.com/v19.0/dialog/oauth');
      expect(url).toContain('client_id=facebook-client-id');
    });
  });

  describe('loginCustomerWithOAuth2', () => {
    it('should return existing customer if OAuth account is bound', async () => {
      const mockCustomer = { id: 'c1', email: 'oauth@test.com' };
      prismaMock.oAuthAccount.findUnique.mockResolvedValue({
        id: 'oa1',
        customer: mockCustomer,
      });

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'valid-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'google-sub-123',
            email: 'oauth@test.com',
            given_name: 'Jane',
            family_name: 'Doe',
          }),
        }) as unknown as typeof fetch;

      const result = await service.loginCustomerWithOAuth2(
        'google',
        'auth-code',
        'verifier',
        'https://app.com/callback',
      );

      expect(result).toEqual(mockCustomer);
    });

    it('should create customer and oauth account in transaction if not existing', async () => {
      prismaMock.oAuthAccount.findUnique.mockResolvedValue(null);
      prismaMock.customerGroup.findFirst.mockResolvedValue({ id: 'g1' });

      const mockNewCustomer = { id: 'c2', email: 'new@test.com' };
      prismaMock.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          customer: { upsert: vi.fn().mockResolvedValue(mockNewCustomer) },
          oAuthAccount: { upsert: vi.fn().mockResolvedValue({}) },
        };
        return callback(mockTx);
      });

      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'valid-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sub: 'google-sub-456',
            email: 'new@test.com',
            given_name: 'Alice',
            family_name: 'Smith',
          }),
        }) as unknown as typeof fetch;

      const result = await service.loginCustomerWithOAuth2(
        'google',
        'auth-code',
        'verifier',
        'https://app.com/callback',
      );

      expect(result).toEqual(mockNewCustomer);
    });

    it('should throw error if OAuth token exchange fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
      }) as unknown as typeof fetch;

      await expect(
        service.loginCustomerWithOAuth2(
          'google',
          'bad-code',
          'verifier',
          'https://app.com/callback',
        ),
      ).rejects.toThrow('OAuth token exchange failed');
    });
  });
});
