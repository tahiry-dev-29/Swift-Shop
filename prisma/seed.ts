import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...\n');
  const adminPassword = await argon2.hash('admin123');
  const employeePassword = await argon2.hash('employee123');
  const customerPassword = await argon2.hash('customer123');
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Full access', isSystem: true },
    { name: 'ADMIN', description: 'Management', isSystem: true },
    { name: 'SALES', description: 'Sales access', isSystem: true },
    { name: 'WAREHOUSE', description: 'Warehouse access', isSystem: true },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log('✅ Roles created');

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });
  const salesRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SALES' } });

  
  const superAdmin = await prisma.employee.upsert({
    where: { email: 'superadmin@dima.com' },
    update: {},
    create: {
      email: 'superadmin@dima.com',
      password: adminPassword,
      firstname: 'Super',
      lastname: 'Admin',
      role: { connect: { id: superAdminRole.id } },
      active: true,
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
      role: { connect: { id: salesRole.id } },
      active: true,
    },
  });
  console.log('✅ Employee created:', employee.email);

  
  const defaultGroup = await prisma.customerGroup.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Default',
      reduction: 0,
      showPrices: true,
    },
  });
  console.log('✅ CustomerGroup created:', defaultGroup.name);

  
  const customer = await prisma.customer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      firstname: 'Jane',
      lastname: 'Doe',
      active: true,
      groupId: defaultGroup.id,
    },
  });
  console.log('✅ Customer created:', customer.email);

  console.log('\n🎉 Seeding completed!\n');
  console.log('📋 Test credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👔 SuperAdmin  : superadmin@dima.com / admin123');
  console.log('👔 Employee    : staff@dima.com / employee123');
  console.log('👤 Customer    : customer@example.com / customer123');
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
