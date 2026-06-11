import { Injectable } from '@nestjs/common';
import { PrismaService } from '@dima-new/data-access-prisma';
import {
  AuditInput,
  SessionAnomalyInput,
  SessionAnomalyResult,
} from '../types/auth-types.internal';

@Injectable()
export class AuthAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async audit(input: AuditInput) {
    await this.prisma.auditLog.create({
      data: {
        action: input.action,
        actorType: input.actorType,
        actorId: input.actorId,
        customerId: input.customerId,
        employeeId: input.employeeId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  }

  async detectSessionAnomaly(
    input: SessionAnomalyInput,
  ): Promise<SessionAnomalyResult> {
    const previousLogin = await this.prisma.auditLog.findFirst({
      where: {
        actorType: input.actorType,
        actorId: input.actorId,
        action: `${input.actorType}.login_success`,
      },
      orderBy: { dateAdd: 'desc' },
    });

    const previousIpAddress = previousLogin?.ipAddress ?? undefined;
    const previousUserAgent = previousLogin?.userAgent ?? undefined;
    const ipAddressChanged =
      Boolean(input.ipAddress) &&
      Boolean(previousIpAddress) &&
      input.ipAddress !== previousIpAddress;
    const userAgentChanged =
      Boolean(input.userAgent) &&
      Boolean(previousUserAgent) &&
      input.userAgent !== previousUserAgent;

    return {
      detected: ipAddressChanged || userAgentChanged,
      ipAddressChanged,
      userAgentChanged,
      previousIpAddress,
      previousUserAgent,
    };
  }
}
