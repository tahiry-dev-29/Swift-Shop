import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';
import { seedPricing } from './seeds/seed-pricing';
import {
  seedCategories,
  seedAttributes,
  seedProducts,
} from './seeds/seed-catalog';
import { seedCustomers } from './seeds/seed-customers';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const permissionActions = [
  'create',
  'read',
  'update',
  'delete',
  'export',
  'impersonate',
];

const permissionResources = [
  'products',
  'orders',
  'customers',
  'catalog',
  'pricing',
  'settings',
  'reports',
  'roles',
];

const systemRoles = [
  {
    name: 'SuperAdmin',
    slug: 'super_admin',
    description: 'Full access to all back-office permissions',
    permissions: '*',
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'All permissions except role management',
    permissions: permissionResources
      .filter((resource) => resource !== 'roles')
      .flatMap((resource) =>
        permissionActions.map((action) => `${resource}:${action}`),
      ),
  },
  {
    name: 'StoreManager',
    slug: 'store_manager',
    description: 'Products, catalog, orders, and customers management',
    permissions: ['products', 'catalog', 'orders', 'customers'].flatMap(
      (resource) =>
        ['create', 'read', 'update', 'delete', 'export'].map(
          (action) => `${resource}:${action}`,
        ),
    ),
  },
  {
    name: 'OrderManager',
    slug: 'order_manager',
    description: 'Orders and shipment operations',
    permissions: [
      'orders:create',
      'orders:read',
      'orders:update',
      'orders:export',
    ],
  },
  {
    name: 'ContentManager',
    slug: 'content_manager',
    description: 'Catalog and product content management',
    permissions: ['catalog', 'products'].flatMap((resource) =>
      ['create', 'read', 'update', 'delete'].map(
        (action) => `${resource}:${action}`,
      ),
    ),
  },
  {
    name: 'SupportAgent',
    slug: 'support_agent',
    description: 'Read-only access to customers and orders',
    permissions: ['customers:read', 'orders:read'],
  },
  {
    name: 'Analyst',
    slug: 'analyst',
    description: 'Read-only reports and dashboard access',
    permissions: ['reports:read', 'reports:export'],
  },
];

async function main() {
  console.log('🌱 Seeding database...\n');
  const adminPassword = await argon2.hash('admin123');
  const employeePassword = await argon2.hash('employee123');

  for (const resource of permissionResources) {
    for (const action of permissionActions) {
      await prisma.permission.upsert({
        where: { slug: `${resource}:${action}` },
        update: {
          resource,
          action,
          description: `${action} ${resource}`,
        },
        create: {
          slug: `${resource}:${action}`,
          resource,
          action,
          description: `${action} ${resource}`,
        },
      });
    }
  }
  console.log('✅ Permissions created');

  const allPermissions = await prisma.permission.findMany();
  const permissionBySlug = new Map(
    allPermissions.map((permission) => [permission.slug, permission.id]),
  );

  for (const r of systemRoles) {
    await prisma.role.upsert({
      where: { slug: r.slug },
      update: {
        name: r.name,
        description: r.description,
        isSystem: true,
        deletedAt: null,
      },
      create: {
        name: r.name,
        slug: r.slug,
        description: r.description,
        isSystem: true,
      },
    });

    const role = await prisma.role.findUniqueOrThrow({
      where: { slug: r.slug },
    });
    const permissionSlugs =
      r.permissions === '*'
        ? allPermissions.map((permission) => permission.slug)
        : r.permissions;
    for (const permissionSlug of permissionSlugs) {
      const permissionId = permissionBySlug.get(permissionSlug);
      if (permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }
  }
  console.log('✅ Roles created');

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { slug: 'super_admin' },
  });
  const supportAgentRole = await prisma.role.findUniqueOrThrow({
    where: { slug: 'support_agent' },
  });

  const superAdmin = await prisma.employee.upsert({
    where: { email: 'superadmin@dima.com' },
    update: {},
    create: {
      email: 'superadmin@dima.com',
      password: adminPassword,
      firstname: 'Super',
      lastname: 'Admin',
      role: { connect: { id: superAdminRole.id } },
      roles: {
        create: {
          role: { connect: { id: superAdminRole.id } },
        },
      },
      active: true,
    },
  });
  await prisma.employeeRole.upsert({
    where: {
      employeeId_roleId: {
        employeeId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    },
    update: {},
    create: {
      employeeId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });
  console.log('✅ SuperAdmin created:', superAdmin.email);

  const employee = await prisma.employee.upsert({
    where: { email: 'staff@dima.com' },
    update: {},
    create: {
      email: 'staff@dima.com',
      password: employeePassword,
      firstname: 'John',
      lastname: 'Staff',
      role: { connect: { id: supportAgentRole.id } },
      roles: {
        create: {
          role: { connect: { id: supportAgentRole.id } },
        },
      },
      active: true,
    },
  });
  await prisma.employeeRole.upsert({
    where: {
      employeeId_roleId: {
        employeeId: employee.id,
        roleId: supportAgentRole.id,
      },
    },
    update: {},
    create: {
      employeeId: employee.id,
      roleId: supportAgentRole.id,
    },
  });
  console.log('✅ Employee created:', employee.email);

  const orderStates = [
    { name: 'PENDING', color: '#fbbf24', position: 0 },
    { name: 'PROCESSING', color: '#3b82f6', position: 1 },
    { name: 'SHIPPED', color: '#8b5cf6', position: 2 },
    { name: 'DELIVERED', color: '#10b981', position: 3 },
    { name: 'CANCELLED', color: '#ef4444', position: 4 },
  ];

  for (const s of orderStates) {
    await prisma.orderState.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log('✅ Order States created');

  await seedCustomers(prisma);
  console.log('✅ Customers and groups seeded');

  await seedPricing(prisma);
  console.log('✅ Pricing data seeded');

  const categories = await seedCategories(prisma);
  await seedAttributes(prisma);
  await seedProducts(prisma, categories);
  console.log('✅ Catalog data seeded');

  console.log('\n🎉 Seeding completed!\n');
  console.log('📋 Test credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👔 SuperAdmin  : superadmin@dima.com / admin123');
  console.log('👔 Employee    : staff@dima.com / employee123');
  console.log('👤 Customers   : (password: customer123)');
  console.log('   - marie.dupont@gmail.com (Default)');
  console.log('   - lucas.moreau@gmail.com (VIP)');
  console.log('   - antoine.mercier@gmail.com (Partner)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
