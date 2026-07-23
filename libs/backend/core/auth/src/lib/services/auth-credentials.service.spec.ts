import { PrismaService } from '@swift-shop/data-access-prisma';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthMailService } from './auth-mail.service';
import { PasswordSecurityService } from './password-security.service';

describe('AuthCredentialsService', () => {
  let service: AuthCredentialsService;
  let prismaMock: {
    customer: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    employee: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
  };
  let mailServiceMock: Mocked<AuthMailService>;
  let passwordSecurityMock: Mocked<PasswordSecurityService>;

  beforeEach(() => {
    prismaMock = {
      customer: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      employee: {
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };

    mailServiceMock = {
      sendAccountLockoutAlert: vi.fn(),
    } as unknown as Mocked<AuthMailService>;

    passwordSecurityMock = {
      verifyPassword: vi.fn(),
      logLockoutMailError: vi.fn(),
    } as unknown as Mocked<PasswordSecurityService>;

    service = new AuthCredentialsService(
      prismaMock as unknown as PrismaService,
      mailServiceMock,
      passwordSecurityMock,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCustomer', () => {
    it('should return null if customer does not exist or is inactive', async () => {
      prismaMock.customer.findUnique.mockResolvedValue(null);
      const res = await service.validateCustomer('none@test.com', 'pass');
      expect(res).toBeNull();
    });

    it('should return null if customer account is locked', async () => {
      prismaMock.customer.findUnique.mockResolvedValue({
        id: 'c1',
        email: 'test@test.com',
        active: true,
        lockedUntil: new Date(Date.now() + 100000),
        failedLoginAttempts: 0,
      });
      const res = await service.validateCustomer('test@test.com', 'pass');
      expect(res).toBeNull();
    });

    it('should validate customer and clear failed logins on correct password', async () => {
      const mockCust = {
        id: 'c1',
        email: 'test@test.com',
        active: true,
        lockedUntil: null,
        failedLoginAttempts: 0,
        password: 'hashedpassword',
      };
      prismaMock.customer.findUnique.mockResolvedValue(mockCust);
      passwordSecurityMock.verifyPassword.mockResolvedValue(true);
      prismaMock.customer.update.mockResolvedValue(mockCust);

      const res = await service.validateCustomer('test@test.com', 'correct');
      expect(res).toEqual(mockCust);
      expect(prismaMock.customer.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    });

    it('should record failed attempt and send lockout mail when threshold reached', async () => {
      const mockCust = {
        id: 'c1',
        email: 'test@test.com',
        active: true,
        lockedUntil: null,
        failedLoginAttempts: 4,
        password: 'hashedpassword',
      };
      prismaMock.customer.findUnique.mockResolvedValue(mockCust);
      passwordSecurityMock.verifyPassword.mockResolvedValue(false);
      prismaMock.customer.update.mockResolvedValue({
        id: 'c1',
        email: 'test@test.com',
        failedLoginAttempts: 5,
      });
      prismaMock.customer.updateMany.mockResolvedValue({ count: 1 });
      mailServiceMock.sendAccountLockoutAlert.mockResolvedValue(undefined);

      const res = await service.validateCustomer('test@test.com', 'wrong');
      expect(res).toBeNull();
      expect(mailServiceMock.sendAccountLockoutAlert).toHaveBeenCalled();
    });
  });

  describe('validateEmployee', () => {
    it('should validate employee and update lastConnectionDate on success', async () => {
      const mockEmp = {
        id: 'e1',
        email: 'emp@test.com',
        active: true,
        lockedUntil: null,
        failedLoginAttempts: 0,
        password: 'hashedpassword',
      };
      prismaMock.employee.findUnique.mockResolvedValue(mockEmp);
      passwordSecurityMock.verifyPassword.mockResolvedValue(true);
      prismaMock.employee.update.mockResolvedValue(mockEmp);

      const res = await service.validateEmployee('emp@test.com', 'correct');
      expect(res).toEqual(mockEmp);
      expect(prismaMock.employee.update).toHaveBeenCalledWith({
        where: { id: 'e1' },
        data: { lastConnectionDate: expect.any(Date) },
      });
    });
  });
});
