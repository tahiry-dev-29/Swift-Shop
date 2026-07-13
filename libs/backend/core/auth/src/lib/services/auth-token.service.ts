import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { JwtPayload } from '@swift-shop/models';
import { RedisService } from '../infrastructure/storage/redis.service';
import { REFRESH_TOKEN_TTL_SECONDS } from '../types/auth-types.internal';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async generateCustomerToken(customer: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    group?: { name: string; reduction: unknown } | null;
  }) {
    return this.signAndStore({
      sub: customer.id,
      email: customer.email,
      type: 'customer',
      purpose: 'access',
      firstname: customer.firstname,
      lastname: customer.lastname,
      groupName: customer.group?.name,
      groupReduction: customer.group?.reduction
        ? Number(customer.group.reduction)
        : undefined,
      tokenType: 'access',
    });
  }

  async generateEmployeeToken(employee: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: { name: string };
  }) {
    return this.signAndStore({
      sub: employee.id,
      email: employee.email,
      type: 'employee',
      purpose: 'access',
      firstname: employee.firstname,
      lastname: employee.lastname,
      role: employee.role.name,
      tokenType: 'access',
    });
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (payload.tokenType === 'refresh') return null;
      return payload.purpose && payload.purpose !== 'access' ? null : payload;
    } catch {
      return null;
    }
  }

  async refreshToken(token: string, expectedType?: 'customer' | 'employee') {
    const payload = this.jwtService.verify<JwtPayload>(token);
    if (expectedType && payload.type !== expectedType) {
      throw new UnauthorizedException(`Invalid token type for this endpoint`);
    }
    await this.assertRefreshTokenActive(payload);
    await this.blacklistCurrentRefreshToken(payload);

    if (payload.type === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
        include: { group: true },
      });
      if (!customer || !customer.active) {
        throw new UnauthorizedException('User inactive');
      }
      const tokens = await this.generateCustomerToken(customer);
      return { ...tokens, customer, oldJti: payload.jti };
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!employee || !employee.active) {
      throw new UnauthorizedException('User inactive');
    }
    const tokens = await this.generateEmployeeToken(employee);
    return { ...tokens, employee, oldJti: payload.jti };
  }

  async logout(userId: string, jti?: string, exp?: number) {
    await this.redisService.storeRefreshToken(userId, '', 1);
    if (!jti || !exp) {
      return;
    }

    const expiresIn = exp - Math.floor(Date.now() / 1000);
    if (expiresIn > 0) {
      await this.redisService.setBlacklistToken(jti, expiresIn);
    }
  }

  private async signAndStore(payloadWithoutJti: Omit<JwtPayload, 'jti'>) {
    const jti = randomUUID();
    const payload: JwtPayload = { ...payloadWithoutJti, jti };
    const refreshTokenPayload: JwtPayload = {
      ...payload,
      tokenType: 'refresh',
      purpose: 'refresh',
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '7d',
    });

    await this.redisService.storeRefreshToken(
      payload.sub,
      jti,
      REFRESH_TOKEN_TTL_SECONDS,
    );
    return { accessToken, refreshToken, jti };
  }

  private async assertRefreshTokenActive(payload: JwtPayload) {
    if (payload.tokenType !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [isBlacklisted, storedJti] = await Promise.all([
      this.redisService.isTokenBlacklisted(payload.jti),
      this.redisService.getStoredRefreshTokenJti(payload.sub),
    ]);
    if (isBlacklisted || storedJti !== payload.jti) {
      // Reuse detected, revoke entire family
      await this.redisService.delete(`rt_${payload.sub}`);
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked.',
      );
    }
  }

  private async blacklistCurrentRefreshToken(payload: JwtPayload) {
    const expiresIn = payload.exp
      ? payload.exp - Math.floor(Date.now() / 1000)
      : REFRESH_TOKEN_TTL_SECONDS;
    if (payload.jti && expiresIn > 0) {
      const set = await this.redisService.setBlacklistTokenNX(
        payload.jti,
        expiresIn,
      );
      if (!set) {
        // Race condition / reuse detected
        await this.redisService.delete(`rt_${payload.sub}`);
        throw new UnauthorizedException(
          'Token reuse detected. All sessions revoked.',
        );
      }
    }
  }
}
