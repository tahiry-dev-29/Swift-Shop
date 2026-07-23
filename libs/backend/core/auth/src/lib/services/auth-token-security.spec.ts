import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { JwtPayload } from '@swift-shop/models';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { RedisService } from '../infrastructure/storage/redis.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthOAuthService } from './auth-oauth.service';
import { AuthRecoveryService } from './auth-recovery.service';
import { AuthTokenService } from './auth-token.service';
import { AuthService } from './auth.service';
import { PasswordSecurityService } from './password-security.service';
import { TrustedDeviceService } from './trusted-device.service';
import { TwoFactorService } from './two-factor.service';

describe('Auth — Token Security Tests', () => {
  let tokenService: AuthTokenService;
  let authService: AuthService;
  let jwtServiceMock: Mocked<JwtService>;
  let redisServiceMock: Mocked<RedisService>;
  let prismaMock: {
    customer: { findUnique: ReturnType<typeof vi.fn> };
    employee: { findUnique: ReturnType<typeof vi.fn> };
  };
  let auditServiceMock: Mocked<AuthAuditService>;

  beforeEach(() => {
    jwtServiceMock = {
      sign: vi.fn().mockReturnValue('signed_jwt_token'),
      verify: vi.fn(),
    } as unknown as Mocked<JwtService>;

    redisServiceMock = {
      storeRefreshToken: vi.fn().mockResolvedValue(undefined),
      getStoredRefreshTokenJti: vi.fn(),
      isTokenBlacklisted: vi.fn(),
      setBlacklistToken: vi.fn().mockResolvedValue(undefined),
      setBlacklistTokenNX: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<RedisService>;

    prismaMock = {
      customer: { findUnique: vi.fn() },
      employee: { findUnique: vi.fn() },
    };

    auditServiceMock = {
      audit: vi.fn().mockResolvedValue(undefined),
      detectSessionAnomaly: vi.fn(),
    } as unknown as Mocked<AuthAuditService>;

    tokenService = new AuthTokenService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock,
      redisServiceMock,
    );

    authService = new AuthService(
      auditServiceMock,
      {} as unknown as AuthCredentialsService,
      {} as unknown as AuthOAuthService,
      {} as unknown as AuthRecoveryService,
      tokenService,
      {} as unknown as PasswordSecurityService,
      {} as unknown as TrustedDeviceService,
      {} as unknown as TwoFactorService,
    );
  });

  describe('1. Refresh Token Rotation', () => {
    it('should rotate tokens, blacklist old JTI via setBlacklistTokenNX, and issue new pair', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'cust1',
        type: 'customer',
        tokenType: 'refresh',
        jti: 'jti_old',
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as JwtPayload);

      redisServiceMock.isTokenBlacklisted.mockResolvedValue(false);
      redisServiceMock.getStoredRefreshTokenJti.mockResolvedValue('jti_old');
      redisServiceMock.setBlacklistTokenNX.mockResolvedValue(true);

      prismaMock.customer.findUnique.mockResolvedValue({
        id: 'cust1',
        email: 'c@test.com',
        active: true,
        firstname: 'John',
        lastname: 'Doe',
      });

      const result = await tokenService.refreshToken(
        'old_rt_token',
        'customer',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('oldJti', 'jti_old');
      expect(redisServiceMock.setBlacklistTokenNX).toHaveBeenCalledWith(
        'jti_old',
        expect.any(Number),
      );
      expect(redisServiceMock.storeRefreshToken).toHaveBeenCalledWith(
        'cust1',
        expect.any(String),
        expect.any(Number),
      );
    });
  });

  describe('2. Refresh Token Reuse & 3. Family-wide Revocation', () => {
    it('should reject already used/blacklisted refresh token and revoke family (rt_userId)', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'cust1',
        type: 'customer',
        tokenType: 'refresh',
        jti: 'jti_reused',
      } as JwtPayload);

      redisServiceMock.isTokenBlacklisted.mockResolvedValue(true);
      redisServiceMock.getStoredRefreshTokenJti.mockResolvedValue('jti_reused');

      await expect(
        tokenService.refreshToken('blacklisted_token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(redisServiceMock.delete).toHaveBeenCalledWith('rt_cust1');
    });

    it('should detect stored JTI mismatch and revoke family (rt_userId)', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'cust1',
        type: 'customer',
        tokenType: 'refresh',
        jti: 'jti_stale',
      } as JwtPayload);

      redisServiceMock.isTokenBlacklisted.mockResolvedValue(false);
      redisServiceMock.getStoredRefreshTokenJti.mockResolvedValue('jti_newest');

      await expect(tokenService.refreshToken('stale_token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(redisServiceMock.delete).toHaveBeenCalledWith('rt_cust1');
    });
  });

  describe('4. Cross-Type Swap', () => {
    it('should reject employee token when expectedType is customer', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'emp1',
        type: 'employee',
        tokenType: 'refresh',
        jti: 'jti_emp',
      } as JwtPayload);

      await expect(
        tokenService.refreshToken('emp_token', 'customer'),
      ).rejects.toThrow('Invalid token type for this endpoint');
    });
  });

  describe('5. Logout', () => {
    it('should blacklist access token JTI and revoke refresh token in Redis', async () => {
      const expInFuture = Math.floor(Date.now() / 1000) + 1800;
      await tokenService.logout('user123', 'jti_access_123', expInFuture);

      expect(redisServiceMock.storeRefreshToken).toHaveBeenCalledWith(
        'user123',
        '',
        1,
      );
      expect(redisServiceMock.setBlacklistToken).toHaveBeenCalledWith(
        'jti_access_123',
        expect.any(Number),
      );
    });
  });

  describe('6. Race Condition', () => {
    it('should handle concurrent refreshes: second setBlacklistTokenNX fails and revokes session family', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'cust1',
        type: 'customer',
        tokenType: 'refresh',
        jti: 'jti_race',
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as JwtPayload);

      redisServiceMock.isTokenBlacklisted.mockResolvedValue(false);
      redisServiceMock.getStoredRefreshTokenJti.mockResolvedValue('jti_race');
      redisServiceMock.setBlacklistTokenNX.mockResolvedValue(false); // second parallel request lost race

      await expect(tokenService.refreshToken('race_token')).rejects.toThrow(
        'Token reuse detected. All sessions revoked.',
      );

      expect(redisServiceMock.delete).toHaveBeenCalledWith('rt_cust1');
    });
  });

  describe('7. verifyToken() checks', () => {
    it('should reject refresh tokens when validating access tokens', () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'user1',
        tokenType: 'refresh',
      } as JwtPayload);

      const result = tokenService.verifyToken('refresh_token');
      expect(result).toBeNull();
    });

    it('should reject non-access purpose tokens', () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'user1',
        purpose: 'customer_magic_link',
      } as JwtPayload);

      const result = tokenService.verifyToken('magic_link_token');
      expect(result).toBeNull();
    });

    it('should return payload for valid access tokens', () => {
      const validPayload = {
        sub: 'user1',
        purpose: 'access',
        tokenType: 'access',
      } as JwtPayload;

      jwtServiceMock.verify.mockReturnValue(validPayload);

      const result = tokenService.verifyToken('valid_access_token');
      expect(result).toEqual(validPayload);
    });
  });

  describe('8. Audit Logging', () => {
    it('should record an AuditLog entry when AuthService.refreshToken is called', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'cust1',
        type: 'customer',
        tokenType: 'refresh',
        jti: 'jti_old',
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as JwtPayload);

      redisServiceMock.isTokenBlacklisted.mockResolvedValue(false);
      redisServiceMock.getStoredRefreshTokenJti.mockResolvedValue('jti_old');
      redisServiceMock.setBlacklistTokenNX.mockResolvedValue(true);

      prismaMock.customer.findUnique.mockResolvedValue({
        id: 'cust1',
        email: 'c@test.com',
        active: true,
        firstname: 'John',
        lastname: 'Doe',
      });

      await authService.refreshToken('old_rt_token', 'customer', {
        ipAddress: '127.0.0.1',
        userAgent: 'Jest/Vitest',
      });

      expect(auditServiceMock.audit).toHaveBeenCalledWith({
        action: 'customer.refresh_token',
        actorType: 'customer',
        actorId: 'cust1',
        metadata: { oldJti: 'jti_old', newJti: expect.any(String) },
        ipAddress: '127.0.0.1',
        userAgent: 'Jest/Vitest',
      });
    });
  });
});
