import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { DEVICE_TRUST_DAYS } from '../types/auth-types.internal';

@Injectable()
export class TrustedDeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async trustEmployeeDevice(employeeId: string, label?: string) {
    const rawToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + DEVICE_TRUST_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.trustedDevice.create({
      data: {
        employeeId,
        tokenHash: this.hashToken(rawToken),
        label,
        expiresAt,
      },
    });
    return rawToken;
  }

  async verifyTrustedEmployeeDevice(employeeId: string, token?: string | null) {
    if (!token) {
      return false;
    }
    const device = await this.prisma.trustedDevice.findFirst({
      where: {
        employeeId,
        tokenHash: this.hashToken(token),
        expiresAt: { gt: new Date() },
      },
    });
    if (!device) {
      return false;
    }
    await this.prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });
    return true;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
