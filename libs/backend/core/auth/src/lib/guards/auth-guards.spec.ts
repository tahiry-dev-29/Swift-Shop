import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { RedisService } from '../infrastructure/storage/redis.service';
import { CustomerGuard } from './customer-guard';
import { EmployeeGuard } from './employee-guard';
import { JwtAuthGuard } from './jwt-auth-guard';
import { OptionalCustomerGuard } from './optional-customer.guard';
import { PermissionGuard } from './permission-guard';
import { SuperAdminGuard } from './super-admin-guard';

describe('Auth — Guards & Decorators Tests', () => {
  let jwtAuthGuard: JwtAuthGuard;
  let customerGuard: CustomerGuard;
  let employeeGuard: EmployeeGuard;
  let superAdminGuard: SuperAdminGuard;
  let optionalCustomerGuard: OptionalCustomerGuard;
  let permissionGuard: PermissionGuard;

  let reflectorMock: Mocked<Reflector>;
  let redisServiceMock: Mocked<RedisService>;
  let prismaMock: {
    employee: { findFirst: ReturnType<typeof vi.fn> };
    rolePermission: { findMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    reflectorMock = {
      getAllAndOverride: vi.fn(),
    } as unknown as Mocked<Reflector>;

    redisServiceMock = {
      getJson: vi.fn().mockResolvedValue(null),
      setJson: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<RedisService>;

    prismaMock = {
      employee: { findFirst: vi.fn() },
      rolePermission: { findMany: vi.fn() },
    };

    jwtAuthGuard = new JwtAuthGuard();
    customerGuard = new CustomerGuard();
    employeeGuard = new EmployeeGuard();
    superAdminGuard = new SuperAdminGuard(
      prismaMock as unknown as PrismaService,
      redisServiceMock,
    );
    optionalCustomerGuard = new OptionalCustomerGuard();
    permissionGuard = new PermissionGuard(
      reflectorMock,
      prismaMock as unknown as PrismaService,
      redisServiceMock,
    );
  });

  describe('1. JwtAuthGuard', () => {
    it('should extract req from GraphQL context', () => {
      const mockReq = { headers: {} };
      vi.spyOn(GqlExecutionContext, 'create').mockReturnValue({
        getContext: () => ({ req: mockReq }),
      } as never);

      const mockExecContext = {} as ExecutionContext;
      const req = jwtAuthGuard.getRequest(mockExecContext);
      expect(req).toBe(mockReq);
    });
  });

  describe('2. CustomerGuard', () => {
    it('should allow customer token', () => {
      const mockUser = {
        id: 'c1',
        email: 'c@test.com',
        type: 'customer' as const,
      };
      const res = customerGuard.handleRequest(
        null,
        mockUser,
        null,
        {} as ExecutionContext,
      );
      expect(res).toEqual(mockUser);
    });

    it('should reject employee token with UnauthorizedException', () => {
      const mockUser = {
        id: 'e1',
        email: 'e@test.com',
        type: 'employee' as const,
      };
      expect(() =>
        customerGuard.handleRequest(
          null,
          mockUser,
          null,
          {} as ExecutionContext,
        ),
      ).toThrow('Customer access only');
    });

    it('should throw UnauthorizedException when unauthenticated or err present', () => {
      expect(() =>
        customerGuard.handleRequest(
          new Error('Invalid'),
          null,
          null,
          {} as ExecutionContext,
        ),
      ).toThrow();
    });
  });

  describe('3. EmployeeGuard', () => {
    it('should allow employee token', () => {
      const mockUser = {
        id: 'e1',
        email: 'e@test.com',
        type: 'employee' as const,
      };
      const res = employeeGuard.handleRequest(
        null,
        mockUser,
        null,
        {} as ExecutionContext,
      );
      expect(res).toEqual(mockUser);
    });

    it('should reject customer token with UnauthorizedException', () => {
      const mockUser = {
        id: 'c1',
        email: 'c@test.com',
        type: 'customer' as const,
      };
      expect(() =>
        employeeGuard.handleRequest(
          null,
          mockUser,
          null,
          {} as ExecutionContext,
        ),
      ).toThrow('Employee access only');
    });
  });

  describe('4. SuperAdminGuard', () => {
    it('should allow super admin employee', async () => {
      vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
      vi.spyOn(superAdminGuard, 'getRequest').mockReturnValue({
        user: { id: 'e_super', type: 'employee' },
      });
      prismaMock.employee.findFirst.mockResolvedValue({ id: 'e_super' });

      const mockExecContext = {} as ExecutionContext;
      const res = await superAdminGuard.canActivate(mockExecContext);
      expect(res).toBe(true);
    });

    it('should reject non-super admin employee', async () => {
      vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
      vi.spyOn(superAdminGuard, 'getRequest').mockReturnValue({
        user: { id: 'e_regular', type: 'employee' },
      });
      prismaMock.employee.findFirst.mockResolvedValue(null);

      const mockExecContext = {} as ExecutionContext;
      await expect(
        superAdminGuard.canActivate(mockExecContext),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. OptionalCustomerGuard', () => {
    it('should allow both authenticated and unauthenticated requests', () => {
      const user = { id: 'c1', type: 'customer' };
      expect(optionalCustomerGuard.handleRequest(null, user)).toEqual(user);
      expect(optionalCustomerGuard.handleRequest(null, null)).toBeNull();
    });
  });

  describe('6. PermissionGuard', () => {
    it('should allow request if no @RequirePermission() decorator is set', async () => {
      vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
      reflectorMock.getAllAndOverride.mockReturnValue(undefined);

      const mockExecContext = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as unknown as ExecutionContext;

      const res = await permissionGuard.canActivate(mockExecContext);
      expect(res).toBe(true);
    });

    it('should allow super admin user regardless of specific permission requirement', async () => {
      vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
      reflectorMock.getAllAndOverride.mockReturnValue('products:create');
      vi.spyOn(permissionGuard as never, 'extractRequest').mockReturnValue({
        user: { id: 'e_super', type: 'employee' },
      });
      redisServiceMock.getJson.mockImplementation(async (key: string) => {
        if (key.includes('superadmin-check')) return true;
        return null;
      });

      const mockExecContext = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as unknown as ExecutionContext;

      const res = await permissionGuard.canActivate(mockExecContext);
      expect(res).toBe(true);
    });

    it('should allow employee with explicit required permission slug', async () => {
      vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
      reflectorMock.getAllAndOverride.mockReturnValue('products:create');
      vi.spyOn(permissionGuard as never, 'extractRequest').mockReturnValue({
        user: { id: 'e1', type: 'employee' },
      });
      redisServiceMock.getJson.mockImplementation(async (key: string) => {
        if (key.includes('superadmin-check')) return false;
        if (key.includes('permissions:employee'))
          return ['products:create', 'products:read'];
        return null;
      });

      const mockExecContext = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as unknown as ExecutionContext;

      const res = await permissionGuard.canActivate(mockExecContext);
      expect(res).toBe(true);
    });

    it('should throw ForbiddenException if employee lacks required permission slug', async () => {
      vi.spyOn(EmployeeGuard.prototype, 'canActivate').mockResolvedValue(true);
      reflectorMock.getAllAndOverride.mockReturnValue('products:delete');
      vi.spyOn(permissionGuard as never, 'extractRequest').mockReturnValue({
        user: { id: 'e1', type: 'employee' },
      });
      redisServiceMock.getJson.mockImplementation(async (key: string) => {
        if (key.includes('superadmin-check')) return false;
        if (key.includes('permissions:employee')) return ['products:read'];
        return null;
      });

      const mockExecContext = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
      } as unknown as ExecutionContext;

      await expect(
        permissionGuard.canActivate(mockExecContext),
      ).rejects.toThrow('Missing permission: products:delete');
    });
  });
});
