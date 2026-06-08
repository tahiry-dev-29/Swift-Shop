import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '@dima-new/data-access-prisma';
import { JwtPayload } from '@dima-new/models';
import { RedisService } from './redis.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService
  ) {}

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async validateCustomer(email: string, password: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { email },
      include: { group: true },
    });

    if (!customer || !customer.active) {
      return null;
    }

    const isValid = await this.verifyPassword(customer.password, password);
    if (!isValid) {
      return null;
    }

    return customer;
  }

  async validateEmployee(email: string, password: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!employee || !employee.active) {
      return null;
    }

    const isValid = await this.verifyPassword(employee.password, password);
    if (!isValid) {
      return null;
    }

    
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { lastConnectionDate: new Date() },
    });

    return employee;
  }

  async generateCustomerToken(customer: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    group?: { name: string; reduction: unknown } | null;
  }) {
    const jti = randomUUID();
    const payload: JwtPayload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
      firstname: customer.firstname,
      lastname: customer.lastname,
      groupName: customer.group?.name,
      groupReduction: customer.group?.reduction
        ? Number(customer.group.reduction)
        : undefined,
      jti,
      tokenType: 'access',
    };

    const refreshTokenPayload: JwtPayload = {
      ...payload,
      tokenType: 'refresh',
    };

    const accessToken = this.jwtService.sign(payload);
    // Refresh token valid for 7 days
    const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });

    // Store the valid refresh token JTI for this user
    await this.redisService.storeRefreshToken(customer.id, jti, 7 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
    };
  }

  async generateEmployeeToken(employee: {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    role: { name: string };
  }) {
    const jti = randomUUID();
    const payload: JwtPayload = {
      sub: employee.id,
      email: employee.email,
      type: 'employee',
      firstname: employee.firstname,
      lastname: employee.lastname,
      role: employee.role.name,
      jti,
      tokenType: 'access',
    };

    const refreshTokenPayload: JwtPayload = {
      ...payload,
      tokenType: 'refresh',
    };

    const accessToken = this.jwtService.sign(payload);
    // Refresh token valid for 7 days
    const refreshToken = this.jwtService.sign(refreshTokenPayload, { expiresIn: '7d' });

    // Store the valid refresh token JTI for this user
    await this.redisService.storeRefreshToken(employee.id, jti, 7 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  async refreshToken(token: string) {
    const payload = this.verifyToken(token);
    
    if (!payload || payload.tokenType !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isBlacklisted = await this.redisService.isTokenBlacklisted(payload.jti);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const storedJti = await this.redisService.getStoredRefreshTokenJti(payload.sub);
    if (storedJti !== payload.jti) {
      throw new UnauthorizedException('Refresh token is no longer active');
    }

    // Blacklist the old token to prevent reuse (rotation)
    const exp = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 7 * 24 * 60 * 60;
    if (exp > 0) {
      await this.redisService.setBlacklistToken(payload.jti, exp);
    }

    if (payload.type === 'customer') {
      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
        include: { group: true },
      });
      if (!customer || !customer.active) throw new UnauthorizedException('User inactive');
      const tokens = await this.generateCustomerToken(customer);
      return { ...tokens, customer };
    } else {
      const employee = await this.prisma.employee.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      if (!employee || !employee.active) throw new UnauthorizedException('User inactive');
      const tokens = await this.generateEmployeeToken(employee);
      return { ...tokens, employee };
    }
  }

  async logout(userId: string, jti?: string, exp?: number) {
    // Invalidate current refresh token
    await this.redisService.storeRefreshToken(userId, '', 1);
    
    if (jti && exp) {
      const expiresIn = exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        await this.redisService.setBlacklistToken(jti, expiresIn);
      }
    }
  }
}

