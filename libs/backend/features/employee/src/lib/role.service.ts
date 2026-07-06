import { Injectable } from '@nestjs/common';
import { PrismaService } from '@swift-shop/data-access-prisma';
import { mapRole, slugify } from './role-utils';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            rolePermissions: true,
            employeeRoles: true,
          },
        },
      },
    });
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description ?? undefined,
      isSystem: role.isSystem,
      permissionCount: role._count.rolePermissions,
      employeeCount: role._count.employeeRoles,
    }));
  }

  async listRoles(filter?: {
    search?: string;
    isSystem?: boolean;
    skip?: number;
    take?: number;
  }) {
    const where: Record<string, unknown> = { deletedAt: null };

    if (filter?.isSystem !== undefined) where['isSystem'] = filter.isSystem;
    if (filter?.search) {
      where['OR'] = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { slug: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip: filter?.skip ?? 0,
        take: filter?.take ?? 20,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              rolePermissions: true,
              employeeRoles: true,
            },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      items: items.map((role) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description ?? undefined,
        isSystem: role.isSystem,
        permissionCount: role._count.rolePermissions,
        employeeCount: role._count.employeeRoles,
      })),
      total,
    };
  }

  async findById(id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: {
        rolePermissions: {
          include: { permission: true },
          orderBy: { permission: { slug: 'asc' } },
        },
      },
    });
    return role ? mapRole(role) : null;
  }

  async create(data: { name: string; slug?: string; description?: string }) {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        slug: data.slug ? slugify(data.slug) : slugify(data.name),
        description: data.description,
        isSystem: false,
      },
    });
    return mapRole(role);
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; description?: string },
  ) {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
    });
    if (!role) throw new Error('Role not found');

    if (role.isSystem) {
      if (data.name && data.name !== role.name) {
        throw new Error('Cannot rename system roles');
      }
      if (data.slug && slugify(data.slug) !== role.slug) {
        throw new Error('Cannot change system role slugs');
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug ? slugify(data.slug) : undefined,
        description: data.description,
      },
      include: {
        rolePermissions: {
          include: { permission: true },
          orderBy: { permission: { slug: 'asc' } },
        },
      },
    });
    return mapRole(updated);
  }

  async delete(id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { employeeRoles: true, employees: true } } },
    });
    if (!role) throw new Error('Role not found');

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }
    if (role._count.employeeRoles > 0 || role._count.employees > 0) {
      throw new Error('Reassign employees before deleting this role');
    }

    const deleted = await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return mapRole(deleted);
  }

  async cloneRole(id: string, newName: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: { rolePermissions: true },
    });
    if (!role) throw new Error('Role not found');

    const cloneSlug = slugify(newName);
    const clone = await this.prisma.role.create({
      data: {
        name: newName,
        slug: cloneSlug,
        description: role.description,
        isSystem: false,
        rolePermissions: {
          create: role.rolePermissions.map((item) => ({
            permission: { connect: { id: item.permissionId } },
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
          orderBy: { permission: { slug: 'asc' } },
        },
      },
    });
    return mapRole(clone);
  }

  async findByIdOrThrow(id: string) {
    const role = await this.findById(id);
    if (!role) throw new Error('Role not found');
    return role;
  }
}
