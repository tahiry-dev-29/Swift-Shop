import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { EmployeeRoleAssignmentService } from './employee-role-assignment.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { RedisService } from '@swift-shop/backend/auth';

describe('EmployeeRoleAssignmentService', () => {
  let service: EmployeeRoleAssignmentService;
  let redisServiceMock: Mocked<RedisService>;
  let prismaMock: {
    employee: {
      update: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    employeeRole: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    temporaryRoleElevation: {
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    employeeStoreBranch: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    permissionAuditLog: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    redisServiceMock = {
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<RedisService>;

    prismaMock = {
      employee: { update: vi.fn(), findUnique: vi.fn() },
      employeeRole: { upsert: vi.fn(), deleteMany: vi.fn() },
      temporaryRoleElevation: { create: vi.fn(), update: vi.fn() },
      employeeStoreBranch: { upsert: vi.fn(), deleteMany: vi.fn() },
      permissionAuditLog: { create: vi.fn() },
      $transaction: vi.fn((actions) => Promise.all(actions)),
    };

    service = new EmployeeRoleAssignmentService(
      prismaMock as unknown as PrismaService,
      redisServiceMock,
    );
  });

  describe('assignRolesToEmployee', () => {
    it('should assign roles to employee, update primary role, log audit, and clear Redis permission cache', async () => {
      const mockEmployee = {
        id: 'emp-1',
        role: {
          id: 'r1',
          name: 'Manager',
          slug: 'manager',
          isSystem: false,
        },
        roles: [],
      };
      prismaMock.employee.findUnique.mockResolvedValue(mockEmployee);

      const result = await service.assignRolesToEmployee(
        'emp-1',
        ['r1', 'r2'],
        'admin-actor',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(redisServiceMock.delete).toHaveBeenCalledWith(
        'permissions:employee:emp-1',
      );
      expect(result.id).toBe('emp-1');
    });
  });

  describe('revokeRolesFromEmployee', () => {
    it('should throw error if attempting to revoke employee primary role', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        roleId: 'primary-role-id',
      });

      await expect(
        service.revokeRolesFromEmployee(
          'emp-1',
          ['primary-role-id'],
          'admin-actor',
        ),
      ).rejects.toThrow('Cannot revoke employee primary role');
    });

    it('should revoke secondary roles successfully', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        roleId: 'primary-role-id',
        role: { id: 'primary-role-id', name: 'Primary', slug: 'primary' },
        roles: [],
      });

      const result = await service.revokeRolesFromEmployee(
        'emp-1',
        ['secondary-role-id'],
        'admin-actor',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(redisServiceMock.delete).toHaveBeenCalledWith(
        'permissions:employee:emp-1',
      );
      expect(result.id).toBe('emp-1');
    });
  });

  describe('TemporaryRoleElevation', () => {
    it('should throw error if elevation expiry date is in the past', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60);

      await expect(
        service.grantTemporaryRoleElevation(
          'emp-1',
          ['role-elevation'],
          pastDate as unknown as string & Date,
        ),
      ).rejects.toThrow('Temporary role elevation must expire in the future');
    });

    it('should grant temporary role elevation and invalidate cache', async () => {
      const futureDate = new Date(Date.now() + 1000 * 3600);
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        role: { id: 'r1', name: 'Role 1', slug: 'role1' },
        roles: [],
      });

      await service.grantTemporaryRoleElevation(
        'emp-1',
        'role-elevation',
        futureDate,
        'actor-admin',
        'Special task',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(redisServiceMock.delete).toHaveBeenCalledWith(
        'permissions:employee:emp-1',
      );
    });

    it('should revoke temporary role elevation by setting revokedAt', async () => {
      prismaMock.temporaryRoleElevation.update.mockResolvedValue({
        id: 'elev-1',
        employeeId: 'emp-1',
        roleId: 'role-elevated',
      });
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        role: { id: 'r1', name: 'Role 1', slug: 'role1' },
        roles: [],
      });

      await service.revokeTemporaryRoleElevation('elev-1', 'actor-admin');

      expect(prismaMock.temporaryRoleElevation.update).toHaveBeenCalledWith({
        where: { id: 'elev-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(redisServiceMock.delete).toHaveBeenCalledWith(
        'permissions:employee:emp-1',
      );
    });
  });

  describe('assignStoreBranchesToEmployee & revokeStoreBranchesFromEmployee', () => {
    it('should assign store branches to employee', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        role: { id: 'r1', name: 'Role 1', slug: 'role1' },
        roles: [],
      });

      const result = await service.assignStoreBranchesToEmployee(
        'emp-1',
        ['b1', 'b2'],
        'actor-admin',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('emp-1');
    });

    it('should revoke store branches from employee', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'emp-1',
        role: { id: 'r1', name: 'Role 1', slug: 'role1' },
        roles: [],
      });

      const result = await service.revokeStoreBranchesFromEmployee(
        'emp-1',
        ['b1'],
        'actor-admin',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(result.id).toBe('emp-1');
    });
  });
});
