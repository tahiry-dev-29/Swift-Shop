import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AuthService } from './auth.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthOAuthService } from './auth-oauth.service';
import { AuthRecoveryService } from './auth-recovery.service';
import { AuthTokenService } from './auth-token.service';
import { PasswordSecurityService } from './password-security.service';
import { TrustedDeviceService } from './trusted-device.service';
import { TwoFactorService } from './two-factor.service';
describe('AuthService', () => {
  let service: AuthService;
  let credentialsService: Mocked<AuthCredentialsService>;
  let tokenService: Mocked<AuthTokenService>;
  let twoFactorService: Mocked<TwoFactorService>;
  let auditService: Mocked<AuthAuditService>;

  beforeEach(() => {
    credentialsService = {
      validateCustomer: vi.fn(),
      validateEmployee: vi.fn(),
    } as unknown as Mocked<AuthCredentialsService>;

    tokenService = {
      generateCustomerToken: vi.fn(),
      generateEmployeeToken: vi.fn(),
      refreshToken: vi.fn(),
      verifyToken: vi.fn(),
      logout: vi.fn(),
    } as unknown as Mocked<AuthTokenService>;

    twoFactorService = {
      generateSecret: vi.fn(),
      generateQrCodeDataURL: vi.fn(),
      verifyToken: vi.fn(),
    } as unknown as Mocked<TwoFactorService>;

    auditService = {
      audit: vi.fn(),
      detectSessionAnomaly: vi.fn(),
    } as unknown as Mocked<AuthAuditService>;

    service = new AuthService(
      auditService,
      credentialsService,
      {} as unknown as AuthOAuthService,
      {} as unknown as AuthRecoveryService,
      tokenService,
      {} as unknown as PasswordSecurityService,
      {} as unknown as TrustedDeviceService,
      twoFactorService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCustomer', () => {
    it('should return null for invalid credentials', async () => {
      credentialsService.validateCustomer.mockResolvedValue(null);
      const result = await service.validateCustomer('user@test.com', 'wrong');
      expect(result).toBeNull();
    });

    it('should return customer on valid credentials', async () => {
      const mockCustomer = { id: 'cust1', email: 'user@test.com' } as never;
      credentialsService.validateCustomer.mockResolvedValue(mockCustomer);

      const result = await service.validateCustomer('user@test.com', 'correct');
      expect(result).toBe(mockCustomer);
    });
  });

  describe('generateCustomerToken', () => {
    it('should return token pair', async () => {
      tokenService.generateCustomerToken.mockResolvedValue({
        accessToken: 'access',
        refreshToken: 'refresh',
        jti: 'jti1',
      });

      const result = await service.generateCustomerToken({
        id: 'cust1',
        email: 'user@test.com',
        firstname: 'John',
        lastname: 'Doe',
      });

      expect(result).toHaveProperty('accessToken', 'access');
      expect(result).toHaveProperty('refreshToken', 'refresh');
    });
  });

  describe('refreshToken', () => {
    it('should call tokenService and audit the refresh', async () => {
      const mockRefreshResult = {
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
        jti: 'jti2',
        oldJti: 'jti1',
        customer: { id: 'cust1' },
      } as never;

      tokenService.refreshToken.mockResolvedValue(mockRefreshResult);
      auditService.audit.mockResolvedValue(undefined as never);

      const result = await service.refreshToken('old_refresh', 'customer');
      expect(result).toBe(mockRefreshResult);
      expect(auditService.audit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'customer.refresh_token' }),
      );
    });
  });

  describe('2FA', () => {
    it('should verify 2FA token correctly', () => {
      twoFactorService.verifyToken.mockReturnValue(true);
      const result = service.verifyTwoFactorToken('secret123', '123456');
      expect(result).toBe(true);
    });

    it('should reject invalid 2FA token', () => {
      twoFactorService.verifyToken.mockReturnValue(false);
      const result = service.verifyTwoFactorToken('secret123', '000000');
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call tokenService.logout with userId, jti and exp', async () => {
      tokenService.logout.mockResolvedValue(undefined);
      await service.logout('cust1', 'jti1', 9999999);
      expect(tokenService.logout).toHaveBeenCalledWith(
        'cust1',
        'jti1',
        9999999,
      );
    });
  });
});
