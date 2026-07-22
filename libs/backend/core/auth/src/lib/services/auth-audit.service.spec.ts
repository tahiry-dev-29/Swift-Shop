import { PrismaService } from '@swift-shop/data-access-prisma';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthAuditService } from './auth-audit.service';

describe('AuthAuditService', () => {
  let service: AuthAuditService;
  let prismaMock: {
    auditLog: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      auditLog: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    service = new AuthAuditService(prismaMock as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('audit', () => {
    it('should create audit log entry in database', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'al1' });

      await service.audit({
        action: 'customer.login_success',
        actorType: 'customer',
        actorId: 'c1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'customer.login_success',
          actorType: 'customer',
          actorId: 'c1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });
  });

  describe('detectSessionAnomaly', () => {
    it('should detect IP and user agent changes from previous login', async () => {
      prismaMock.auditLog.findFirst.mockResolvedValue({
        ipAddress: '192.168.1.1',
        userAgent: 'Firefox/100',
      });

      const anomaly = await service.detectSessionAnomaly({
        actorType: 'customer',
        actorId: 'c1',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120',
      });

      expect(anomaly).toEqual({
        detected: true,
        ipAddressChanged: true,
        userAgentChanged: true,
        previousIpAddress: '192.168.1.1',
        previousUserAgent: 'Firefox/100',
      });
    });

    it('should return detected = false when IP and user agent match previous login', async () => {
      prismaMock.auditLog.findFirst.mockResolvedValue({
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
      });

      const anomaly = await service.detectSessionAnomaly({
        actorType: 'customer',
        actorId: 'c1',
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120',
      });

      expect(anomaly).toEqual({
        detected: false,
        ipAddressChanged: false,
        userAgentChanged: false,
        previousIpAddress: '192.168.1.1',
        previousUserAgent: 'Chrome/120',
      });
    });
  });
});
