import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as argon2 from 'argon2';
import { seedPricing } from './seeds/seed-pricing';
import { seedCategories, seedAttributes, seedProducts } from './seeds/seed-catalog';
import { seedCustomers } from './seeds/seed-customers';

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...\n');
  const adminPassword = await argon2.hash('admin123');
  const employeePassword = await argon2.hash('employee123');
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

  // Seed all customers and customer groups
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

