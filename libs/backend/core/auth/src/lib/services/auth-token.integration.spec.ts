import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AuthTokenService } from './auth-token.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { JwtPayload } from '@swift-shop/models';
import { RedisService } from '../infrastructure/storage/redis.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthTokenService — Full Login → Refresh → Logout flow', () => {
  let service: AuthTokenService;
  let jwtService: Mocked<JwtService>;
  let redisService: Mocked<RedisService>;
  let prisma: Mocked<PrismaService>;

  const mockCustomer = {
    id: 'cust1',
    email: 'user@test.com',
    firstname: 'John',
    lastname: 'Doe',
    active: true,
  };

  beforeEach(() => {
    jwtService = {
      sign: vi.fn().mockReturnValue('token'),
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

  it('full flow: login → refresh → logout → old token rejected', async () => {
    // STEP 1: Login — generate token pair
    const { accessToken, refreshToken, jti } =
      await service.generateCustomerToken(mockCustomer);

    expect(accessToken).toBe('token');
    expect(refreshToken).toBe('token');
    expect(typeof jti).toBe('string');
    expect(redisService.storeRefreshToken).toHaveBeenCalledWith(
      mockCustomer.id,
      jti,
      expect.any(Number),
    );

    // STEP 2: Refresh — simulate valid refresh
    const newJti = 'new-jti-abc';
    jwtService.verify.mockReturnValue({
      sub: mockCustomer.id,
      tokenType: 'refresh',
      jti,
      type: 'customer',
      exp: Date.now() / 1000 + 3600,
    } as unknown as JwtPayload);
    redisService.isTokenBlacklisted.mockResolvedValue(false);
    redisService.getStoredRefreshTokenJti.mockResolvedValue(jti);
    redisService.setBlacklistTokenNX.mockResolvedValue(true);
    prisma.customer.findUnique.mockResolvedValue(mockCustomer as never);
    jwtService.sign.mockReturnValue('new_access_token');

    const refreshResult = await service.refreshToken(refreshToken, 'customer');
    expect(refreshResult).toHaveProperty('accessToken');
    expect(refreshResult).toHaveProperty('oldJti', jti);

    // STEP 3: Logout — revoke tokens
    await service.logout(mockCustomer.id, newJti, Date.now() / 1000 + 3600);
    expect(redisService.storeRefreshToken).toHaveBeenCalledWith(
      mockCustomer.id,
      '',
      1,
    );
    expect(redisService.setBlacklistToken).toHaveBeenCalledWith(
      newJti,
      expect.any(Number),
    );

    // STEP 4: Use old refresh token → must fail
    redisService.isTokenBlacklisted.mockResolvedValue(true);
    await expect(service.refreshToken(refreshToken)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(redisService.delete).toHaveBeenCalledWith(`rt_${mockCustomer.id}`);
  });
});
