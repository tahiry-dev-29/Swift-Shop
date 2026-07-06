import { Injectable } from '@nestjs/common';
import { RedisService } from '@swift-shop/backend/auth';
import { PrismaService } from '@swift-shop/data-access-prisma';

type CustomerRoleData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: unknown;
  dateAdd: Date;
};

@Injectable()
export class CustomerRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private mapRole(role: CustomerRoleData) {
    const rawPermissions = role.permissions;
    const permissions: string[] = Array.isArray(rawPermissions)
      ? rawPermissions.map((p) => String(p))
      : [];

    return {
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      permissions,
      dateAdd: role.dateAdd,
    };
  }

  async findAll() {
    const roles = await this.prisma.customerRole.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    });

    return roles.map((role) => ({
      ...this.mapRole(role),
      customerCount: role._count.customers,
    }));
  }

  async findById(id: string) {
    const role = await this.prisma.customerRole.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    });

    if (!role) return null;
    return {
      ...this.mapRole(role),
      customerCount: role._count.customers,
    };
  }

  async create(data: {
    name: string;
    slug?: string;
    description?: string;
    permissions?: string[];
  }) {
    const slug = data.slug ? this.slugify(data.slug) : this.slugify(data.name);
    const role = await this.prisma.customerRole.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        permissions: data.permissions ?? [],
        isSystem: false,
      },
    });

    return this.mapRole(role);
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
    },
  ) {
    const role = await this.prisma.customerRole.findFirst({
      where: { id, deletedAt: null },
    });
    if (!role) throw new Error('Customer role not found');

    if (role.isSystem && data.name && data.name !== role.name) {
      throw new Error('Cannot rename system customer roles');
    }

    const updated = await this.prisma.customerRole.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
      },
    });

    // Invalidate caches for all customers having this role
    const assignments = await this.prisma.customerRoleAssignment.findMany({
      where: { customerRoleId: id },
      select: { customerId: true },
    });
    await Promise.all(
      assignments.map((a) =>
        this.redisService.delete(`role-slugs:customer:${a.customerId}`),
      ),
    );

    return this.mapRole(updated);
  }

  async delete(id: string) {
    const role = await this.prisma.customerRole.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    });
    if (!role) throw new Error('Customer role not found');
    if (role.isSystem) throw new Error('Cannot delete system customer roles');
    if (role._count.customers > 0) {
      throw new Error('Reassign customers before deleting this role');
    }

    const deleted = await this.prisma.customerRole.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapRole(deleted);
  }

  async assignRoleToCustomer(customerId: string, customerRoleId: string) {
    await this.prisma.customerRoleAssignment.upsert({
      where: {
        customerId_customerRoleId: { customerId, customerRoleId },
      },
      update: {},
      create: { customerId, customerRoleId },
    });

    await this.redisService.delete(`role-slugs:customer:${customerId}`);
    return this.findById(customerRoleId);
  }

  async revokeRoleFromCustomer(customerId: string, customerRoleId: string) {
    await this.prisma.customerRoleAssignment.deleteMany({
      where: { customerId, customerRoleId },
    });

    await this.redisService.delete(`role-slugs:customer:${customerId}`);
    return this.findById(customerRoleId);
  }

  async getCustomerRoles(customerId: string) {
    const assignments = await this.prisma.customerRoleAssignment.findMany({
      where: { customerId, customerRole: { deletedAt: null } },
      include: { customerRole: true },
    });

    return assignments.map((a) => this.mapRole(a.customerRole));
  }
}
