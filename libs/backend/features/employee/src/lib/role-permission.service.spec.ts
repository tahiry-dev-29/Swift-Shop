import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import { RolePermissionService } from './role-permission.service';
import { RoleService } from './role.service';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { RedisService } from '@swift-shop/backend/auth';

describe('RolePermissionService', () => {
  let service: RolePermissionService;
  let roleServiceMock: Mocked<RoleService>;
  let redisServiceMock: Mocked<RedisService>;
  let prismaMock: {
    role: { findFirst: ReturnType<typeof vi.fn> };
    rolePermission: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
    permissionAuditLog: { create: ReturnType<typeof vi.fn> };
    permission: { findMany: ReturnType<typeof vi.fn> };
    employee: {
      findUnique: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    roleServiceMock = {
      findByIdOrThrow: vi.fn(),
    } as unknown as Mocked<RoleService>;

    redisServiceMock = {
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<RedisService>;

    prismaMock = {
      role: { findFirst: vi.fn() },
      rolePermission: { upsert: vi.fn(), deleteMany: vi.fn() },
      permissionAuditLog: { create: vi.fn() },
      permission: { findMany: vi.fn() },
      employee: { findUnique: vi.fn(), findMany: vi.fn() },
      $transaction: vi.fn((actions) => Promise.all(actions)),
    };

    service = new RolePermissionService(
      prismaMock as unknown as PrismaService,
      roleServiceMock,
      redisServiceMock,
    );
  });

  describe('assignPermissionsToRole', () => {
    it('should throw error if attempting to modify super_admin system role', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'super-admin-role',
        isSystem: true,
        slug: 'super_admin',
      });

      await expect(
        service.assignPermissionsToRole('super-admin-role', ['p1', 'p2']),
      ).rejects.toThrow('SuperAdmin permissions cannot be modified');
    });

    it('should assign permissions, create audit logs, and invalidate redis cache', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'role-1',
        isSystem: false,
        slug: 'custom-role',
      });
      prismaMock.employee.findMany.mockResolvedValue([
        { id: 'e1' },
        { id: 'e2' },
      ]);
      roleServiceMock.findByIdOrThrow.mockResolvedValue({
        id: 'role-1',
        name: 'Custom',
        slug: 'custom-role',
        isSystem: false,
        permissions: [],
      });

      const result = await service.assignPermissionsToRole(
        'role-1',
        ['p1', 'p2'],
        'actor-admin',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(redisServiceMock.delete).toHaveBeenCalledWith(
        'permissions:employee:e1',
      );
      expect(redisServiceMock.delete).toHaveBeenCalledWith(
        'permissions:employee:e2',
      );
      expect(result.id).toBe('role-1');
    });
  });

  describe('revokePermissionsFromRole', () => {
    it('should revoke permissions and log action', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'role-1',
        isSystem: false,
        slug: 'custom-role',
      });
      prismaMock.employee.findMany.mockResolvedValue([{ id: 'e1' }]);
      roleServiceMock.findByIdOrThrow.mockResolvedValue({
        id: 'role-1',
        name: 'Custom',
        slug: 'custom-role',
        isSystem: false,
        permissions: [],
      });

      const result = await service.revokePermissionsFromRole(
        'role-1',
        ['p1'],
        'actor-admin',
      );

      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(redisServiceMock.delete).toHaveBeenCalledWith(
        'permissions:employee:e1',
      );
      expect(result.id).toBe('role-1');
    });
  });

  describe('getPermissionsMatrix', () => {
    it('should return grouped permissions matrix across resources and actions', async () => {
      prismaMock.permission.findMany.mockResolvedValue([
        {
          id: 'p-prod-create',
          resource: 'products',
          action: 'create',
          slug: 'products:create',
        },
      ]);

      const matrix = await service.getPermissionsMatrix();

      expect(Array.isArray(matrix)).toBe(true);
      const productGroup = matrix.find((m) => m.resource === 'products');
      expect(productGroup).toBeDefined();
    });
  });

  describe('getEffectivePermissions', () => {
    it('should resolve and aggregate primary role, assigned roles, and temporary elevations', async () => {
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 'e1',
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'p1',
                resource: 'products',
                action: 'read',
                slug: 'products:read',
              },
            },
          ],
        },
        roles: [
          {
            role: {
              rolePermissions: [
                {
                  permission: {
                    id: 'p2',
                    resource: 'products',
                    action: 'create',
                    slug: 'products:create',
                  },
                },
              ],
            },
          },
        ],
        temporaryRoleElevations: [
          {
            role: {
              rolePermissions: [
                {
                  permission: {
                    id: 'p3',
                    resource: 'orders',
                    action: 'manage',
                    slug: 'orders:manage',
                  },
                },
              ],
            },
          },
        ],
      });

      const effective = await service.getEffectivePermissions('e1');

      expect(effective).toHaveLength(3);
      expect(effective.map((p) => p.slug)).toContain('products:read');
      expect(effective.map((p) => p.slug)).toContain('products:create');
      expect(effective.map((p) => p.slug)).toContain('orders:manage');
    });
  });

  describe('hasPermission', () => {
    it('should return true if employee has required permission slug', async () => {
      vi.spyOn(service, 'getEffectivePermissions').mockResolvedValue([
        {
          id: 'p1',
          resource: 'products',
          action: 'create',
          slug: 'products:create',
        },
      ]);

      const hasPerm = await service.hasPermission('e1', 'products:create');
      expect(hasPerm).toBe(true);
    });

    it('should return false if employee lacks required permission', async () => {
      vi.spyOn(service, 'getEffectivePermissions').mockResolvedValue([]);

      const hasPerm = await service.hasPermission('e1', 'products:delete');
      expect(hasPerm).toBe(false);
    });
  });
});
