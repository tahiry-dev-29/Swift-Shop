import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { JwtPayload } from '@swift-shop/models';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AuthMailService } from './auth-mail.service';
import { AuthRecoveryService } from './auth-recovery.service';
import { PasswordSecurityService } from './password-security.service';

describe('AuthRecoveryService', () => {
  let service: AuthRecoveryService;
  let prismaMock: {
    customer: {
      findUnique: ReturnType<typeof vi.fn>;
    };
    employee: {
      update: ReturnType<typeof vi.fn>;
    };
  };
  let jwtServiceMock: Mocked<JwtService>;
  let mailServiceMock: Mocked<AuthMailService>;
  let passwordSecurityMock: Mocked<PasswordSecurityService>;

  beforeEach(() => {
    prismaMock = {
      customer: {
        findUnique: vi.fn(),
      },
      employee: {
        update: vi.fn(),
      },
    };

    jwtServiceMock = {
      sign: vi.fn().mockReturnValue('signed-jwt-token'),
      verify: vi.fn(),
    } as unknown as Mocked<JwtService>;

    mailServiceMock = {
      sendCustomerMagicLink: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<AuthMailService>;

    passwordSecurityMock = {
      assertPasswordPolicy: vi.fn().mockResolvedValue(undefined),
      hashWithoutPolicy: vi.fn().mockResolvedValue('hashed-new-pass'),
    } as unknown as Mocked<PasswordSecurityService>;

    service = new AuthRecoveryService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock,
      mailServiceMock,
      passwordSecurityMock,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendCustomerMagicLink', () => {
    it('should delegate to mailService', async () => {
      await service.sendCustomerMagicLink(
        'cust@test.com',
        'https://app.com/magic?token=123',
      );
      expect(mailServiceMock.sendCustomerMagicLink).toHaveBeenCalledWith(
        'cust@test.com',
        'https://app.com/magic?token=123',
      );
    });
  });

  describe('generateCustomerMagicLinkToken', () => {
    it('should sign magic link JWT token', () => {
      const token = service.generateCustomerMagicLinkToken({
        id: 'c1',
        email: 'cust@test.com',
        firstname: 'John',
        lastname: 'Doe',
      });
      expect(token).toBe('signed-jwt-token');
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'c1',
          type: 'customer',
          purpose: 'customer_magic_link',
        }),
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
    });
  });

  describe('verifyCustomerMagicLink', () => {
    it('should return null if token type or purpose is invalid', async () => {
      jwtServiceMock.verify.mockReturnValue({
        type: 'employee',
        purpose: 'invalid',
      } as JwtPayload);

      const res = await service.verifyCustomerMagicLink('bad-token');
      expect(res).toBeNull();
    });

    it('should return null if customer is locked or inactive', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'c1',
        type: 'customer',
        purpose: 'customer_magic_link',
      } as JwtPayload);

      prismaMock.customer.findUnique.mockResolvedValue({
        id: 'c1',
        active: true,
        lockedUntil: new Date(Date.now() + 60000),
      });

      const res = await service.verifyCustomerMagicLink('locked-token');
      expect(res).toBeNull();
    });

    it('should return customer for valid magic link token', async () => {
      const mockCustomer = {
        id: 'c1',
        email: 'cust@test.com',
        active: true,
        lockedUntil: null,
      };

      jwtServiceMock.verify.mockReturnValue({
        sub: 'c1',
        type: 'customer',
        purpose: 'customer_magic_link',
      } as JwtPayload);

      prismaMock.customer.findUnique.mockResolvedValue(mockCustomer);

      const res = await service.verifyCustomerMagicLink('valid-token');
      expect(res).toEqual(mockCustomer);
    });
  });

  describe('completeForcedPasswordReset', () => {
    it('should assert policy, hash password, and update employee account', async () => {
      const mockUpdatedEmployee = {
        id: 'e1',
        email: 'emp@test.com',
        forcePasswordReset: false,
      };

      jwtServiceMock.verify.mockReturnValue({
        sub: 'e1',
        type: 'employee',
        purpose: 'employee_password_reset',
      } as JwtPayload);

      prismaMock.employee.update.mockResolvedValue(mockUpdatedEmployee);

      const res = await service.completeForcedPasswordReset(
        'valid-reset-token',
        'NewP@ssw0rd!2026',
      );

      expect(res).toEqual(mockUpdatedEmployee);
      expect(passwordSecurityMock.assertPasswordPolicy).toHaveBeenCalledWith(
        'NewP@ssw0rd!2026',
      );
      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: {
          password: 'hashed-new-pass',
          forcePasswordReset: false,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        include: { role: true },
      });
    });
  });
});
