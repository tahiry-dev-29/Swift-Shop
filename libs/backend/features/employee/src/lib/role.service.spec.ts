import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoleService } from './role.service';
import { PrismaService } from '@swift-shop/data-access-prisma';

describe('RoleService', () => {
  let service: RoleService;
  let prismaMock: {
    role: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      role: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new RoleService(prismaMock as unknown as PrismaService);
  });

  describe('findAll', () => {
    it('should return all non-deleted roles with permissions and employee count', async () => {
      const mockRoles = [
        {
          id: 'role-1',
          name: 'Admin',
          slug: 'admin',
          description: 'Administrator role',
          isSystem: true,
          _count: { rolePermissions: 10, employeeRoles: 3 },
        },
      ];
      prismaMock.role.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'role-1',
        name: 'Admin',
        slug: 'admin',
        description: 'Administrator role',
        isSystem: true,
        permissionCount: 10,
        employeeCount: 3,
      });
    });
  });

  describe('listRoles', () => {
    it('should paginate and filter roles by search term and isSystem flag', async () => {
      const mockRoles = [
        {
          id: 'role-2',
          name: 'Store Manager',
          slug: 'store_manager',
          description: null,
          isSystem: false,
          _count: { rolePermissions: 5, employeeRoles: 1 },
        },
      ];
      prismaMock.role.findMany.mockResolvedValue(mockRoles);
      prismaMock.role.count.mockResolvedValue(1);

      const result = await service.listRoles({
        search: 'Store',
        isSystem: false,
        skip: 0,
        take: 10,
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].slug).toBe('store_manager');
    });
  });

  describe('findById', () => {
    it('should return mapped role when found', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'Admin',
        slug: 'admin',
        description: 'Desc',
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        rolePermissions: [
          {
            permission: {
              id: 'perm-1',
              resource: 'products',
              action: 'create',
              slug: 'products:create',
              description: 'Create products',
            },
          },
        ],
      };
      prismaMock.role.findFirst.mockResolvedValue(mockRole);

      const result = await service.findById('role-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('role-1');
      expect(result?.permissions).toHaveLength(1);
    });

    it('should return null when role is not found', async () => {
      prismaMock.role.findFirst.mockResolvedValue(null);

      const result = await service.findById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a custom non-system role with slugified slug', async () => {
      const mockCreated = {
        id: 'role-new',
        name: 'Order Specialist',
        slug: 'order-specialist',
        description: 'Handles orders',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        rolePermissions: [],
      };
      prismaMock.role.create.mockResolvedValue(mockCreated);

      const result = await service.create({
        name: 'Order Specialist',
        description: 'Handles orders',
      });

      expect(prismaMock.role.create).toHaveBeenCalledWith({
        data: {
          name: 'Order Specialist',
          slug: 'order_specialist',
          description: 'Handles orders',
          isSystem: false,
        },
      });
      expect(result.name).toBe('Order Specialist');
    });
  });

  describe('update', () => {
    it('should throw error if system role name or slug is modified', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'role-sys',
        name: 'SuperAdmin',
        slug: 'super_admin',
        isSystem: true,
      });

      await expect(
        service.update('role-sys', { name: 'Changed Name' }),
      ).rejects.toThrow('Cannot rename system roles');
    });

    it('should update non-system role successfully', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'role-custom',
        name: 'Custom',
        slug: 'custom',
        isSystem: false,
      });
      prismaMock.role.update.mockResolvedValue({
        id: 'role-custom',
        name: 'Updated Custom',
        slug: 'updated-custom',
        description: 'New description',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        rolePermissions: [],
      });

      const result = await service.update('role-custom', {
        name: 'Updated Custom',
        description: 'New description',
      });

      expect(result.name).toBe('Updated Custom');
    });
  });

  describe('delete (soft delete)', () => {
    it('should prevent deletion of system roles', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'sys-role',
        isSystem: true,
        _count: { employeeRoles: 0, employees: 0 },
      });

      await expect(service.delete('sys-role')).rejects.toThrow(
        'Cannot delete system roles',
      );
    });

    it('should prevent deletion if role has active assigned employees', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'role-assigned',
        isSystem: false,
        _count: { employeeRoles: 2, employees: 0 },
      });

      await expect(service.delete('role-assigned')).rejects.toThrow(
        'Reassign employees before deleting this role',
      );
    });

    it('should soft delete valid unassigned role', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'role-clean',
        isSystem: false,
        _count: { employeeRoles: 0, employees: 0 },
      });
      prismaMock.role.update.mockResolvedValue({
        id: 'role-clean',
        name: 'Clean Role',
        slug: 'clean-role',
        description: null,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
        rolePermissions: [],
      });

      const result = await service.delete('role-clean');

      expect(prismaMock.role.update).toHaveBeenCalledWith({
        where: { id: 'role-clean' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result.id).toBe('role-clean');
    });
  });

  describe('cloneRole', () => {
    it('should clone an existing role with its permissions', async () => {
      prismaMock.role.findFirst.mockResolvedValue({
        id: 'source-role',
        name: 'Source',
        description: 'Source desc',
        rolePermissions: [{ permissionId: 'p1' }, { permissionId: 'p2' }],
      });

      prismaMock.role.create.mockResolvedValue({
        id: 'cloned-role',
        name: 'Cloned Role',
        slug: 'cloned-role',
        description: 'Source desc',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        rolePermissions: [],
      });

      const result = await service.cloneRole('source-role', 'Cloned Role');

      expect(result.id).toBe('cloned-role');
      expect(prismaMock.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Cloned Role',
            slug: 'cloned_role',
            isSystem: false,
          }),
        }),
      );
    });
  });
});
