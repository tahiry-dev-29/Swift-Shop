import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { JwtPayload } from '@swift-shop/models';
import { RedisService } from '../infrastructure/storage/redis.service';
import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let jwtService: Mocked<JwtService>;
  let redisService: Mocked<RedisService>;
  let prisma: Mocked<PrismaService>;

  beforeEach(async () => {
    jwtService = {
      sign: vi.fn(),
      verify: vi.fn(),
    } as unknown as Mocked<JwtService>;

    redisService = {
      storeRefreshToken: vi.fn(),
      getStoredRefreshTokenJti: vi.fn(),
      isTokenBlacklisted: vi.fn(),
      setBlacklistToken: vi.fn(),
      setBlacklistTokenNX: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mocked<RedisService>;

    prisma = {
      customer: { findUnique: vi.fn() },
      employee: { findUnique: vi.fn() },
    } as unknown as Mocked<PrismaService>;

    service = new AuthTokenService(prisma, jwtService, redisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCustomerToken', () => {
    it('should generate a token pair', async () => {
      jwtService.sign.mockReturnValue('token');
      const result = await service.generateCustomerToken({
        id: '1',
        email: 'test@test.com',
        firstname: 'John',
        lastname: 'Doe',
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('jti');
      expect(redisService.storeRefreshToken).toHaveBeenCalledWith(
        '1',
        expect.any(String),
        expect.any(Number),
      );
    });
  });

  describe('refreshToken', () => {
    it('should rotate token', async () => {
      jwtService.verify.mockReturnValue({
        sub: '1',
        tokenType: 'refresh',
        jti: 'jti1',
        type: 'customer',
      } as unknown as JwtPayload);
      redisService.isTokenBlacklisted.mockResolvedValue(false);
      redisService.getStoredRefreshTokenJti.mockResolvedValue('jti1');
      redisService.setBlacklistTokenNX.mockResolvedValue(true);
      prisma.customer.findUnique.mockResolvedValue({
        id: '1',
        active: true,
      } as never);
      jwtService.sign.mockReturnValue('new_token');

      const result = await service.refreshToken('valid_token', 'customer');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('oldJti', 'jti1');
      expect(redisService.setBlacklistTokenNX).toHaveBeenCalled();
    });

    it('should error on blacklisted token', async () => {
      jwtService.verify.mockReturnValue({
        sub: '1',
        tokenType: 'refresh',
        jti: 'jti1',
        type: 'customer',
      } as unknown as JwtPayload);
      redisService.isTokenBlacklisted.mockResolvedValue(true);
      redisService.getStoredRefreshTokenJti.mockResolvedValue('jti1');

      await expect(service.refreshToken('blacklisted_token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.delete).toHaveBeenCalledWith('rt_1');
    });

    it('should error on race condition (reuse)', async () => {
      jwtService.verify.mockReturnValue({
        sub: '1',
        tokenType: 'refresh',
        jti: 'jti1',
        type: 'customer',
        exp: Date.now() / 1000 + 3600,
      } as unknown as JwtPayload);
      redisService.isTokenBlacklisted.mockResolvedValue(false);
      redisService.getStoredRefreshTokenJti.mockResolvedValue('jti1');
      redisService.setBlacklistTokenNX.mockResolvedValue(false);

      await expect(service.refreshToken('valid_token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.delete).toHaveBeenCalledWith('rt_1');
    });
  });

  describe('logout', () => {
    it('should revoke active refresh token', async () => {
      await service.logout('1', 'jti1', Date.now() / 1000 + 3600);
      expect(redisService.storeRefreshToken).toHaveBeenCalledWith('1', '', 1);
      expect(redisService.setBlacklistToken).toHaveBeenCalledWith(
        'jti1',
        expect.any(Number),
      );
    });
  });
});
