import { PrismaService } from '@swift-shop/data-access-prisma';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrustedDeviceService } from './trusted-device.service';

describe('TrustedDeviceService', () => {
  let service: TrustedDeviceService;
  let prismaMock: {
    trustedDevice: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      trustedDevice: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new TrustedDeviceService(prismaMock as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trustEmployeeDevice', () => {
    it('should create trusted device in database and return raw token string', async () => {
      prismaMock.trustedDevice.create.mockResolvedValue({ id: 'td1' });

      const token = await service.trustEmployeeDevice(
        'emp1',
        'MacBook Pro Chrome',
      );

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
      expect(prismaMock.trustedDevice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeId: 'emp1',
          label: 'MacBook Pro Chrome',
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
    });
  });

  describe('verifyTrustedEmployeeDevice', () => {
    it('should return false if token is not provided', async () => {
      const res = await service.verifyTrustedEmployeeDevice('emp1', null);
      expect(res).toBe(false);
    });

    it('should return false if device token is expired or not found', async () => {
      prismaMock.trustedDevice.findFirst.mockResolvedValue(null);
      const res = await service.verifyTrustedEmployeeDevice('emp1', 'invalid');
      expect(res).toBe(false);
    });

    it('should update lastUsedAt and return true for valid device token', async () => {
      prismaMock.trustedDevice.findFirst.mockResolvedValue({
        id: 'td1',
        employeeId: 'emp1',
      });
      prismaMock.trustedDevice.update.mockResolvedValue({ id: 'td1' });

      const res = await service.verifyTrustedEmployeeDevice('emp1', 'rawtoken');
      expect(res).toBe(true);
      expect(prismaMock.trustedDevice.update).toHaveBeenCalledWith({
        where: { id: 'td1' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });
  });
});
