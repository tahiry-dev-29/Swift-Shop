import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

export interface CustomerData {
  email: string;
  firstname: string;
  lastname: string;
  company?: string;
  birthday?: Date;
}

// Customer list with realistic data
const customersList: CustomerData[] = [
  { email: 'marie.dupont@gmail.com', firstname: 'Marie', lastname: 'Dupont', birthday: new Date('1990-03-15') },
  { email: 'jean.martin@yahoo.fr', firstname: 'Jean', lastname: 'Martin', company: 'Tech Solutions' },
  { email: 'sophie.bernard@outlook.com', firstname: 'Sophie', lastname: 'Bernard', birthday: new Date('1985-07-22') },
  { email: 'pierre.durand@gmail.com', firstname: 'Pierre', lastname: 'Durand' },
  { email: 'emma.leroy@hotmail.com', firstname: 'Emma', lastname: 'Leroy', birthday: new Date('1995-11-08') },
  { email: 'lucas.moreau@gmail.com', firstname: 'Lucas', lastname: 'Moreau', company: 'StartupXYZ' },
  { email: 'chloe.petit@yahoo.fr', firstname: 'Chloé', lastname: 'Petit' },
  { email: 'hugo.roux@outlook.com', firstname: 'Hugo', lastname: 'Roux', birthday: new Date('1988-04-30') },
  { email: 'lea.fontaine@gmail.com', firstname: 'Léa', lastname: 'Fontaine', company: 'Design Co.' },
  { email: 'thomas.girard@hotmail.com', firstname: 'Thomas', lastname: 'Girard' },
  { email: 'camille.lambert@gmail.com', firstname: 'Camille', lastname: 'Lambert', birthday: new Date('1992-09-12') },
  { email: 'maxime.bonnet@yahoo.fr', firstname: 'Maxime', lastname: 'Bonnet' },
  { email: 'clara.dubois@outlook.com', firstname: 'Clara', lastname: 'Dubois', company: 'Media France' },
  { email: 'antoine.mercier@gmail.com', firstname: 'Antoine', lastname: 'Mercier', birthday: new Date('1980-12-25') },
  { email: 'julie.robert@hotmail.com', firstname: 'Julie', lastname: 'Robert' },
];

export const seedCustomers = async (prisma: PrismaClient) => {
  console.log('👥 Seeding Customers...');

  // Create customer groups
  const groups = [
    { name: 'Default', reduction: 0, showPrices: true },
    { name: 'VIP', reduction: 10, showPrices: true },
    { name: 'Wholesale', reduction: 15, showPrices: true },
    { name: 'Partner', reduction: 20, showPrices: true },
  ];

  const createdGroups: { id: string; name: string }[] = [];

  for (const group of groups) {
    let existing = await prisma.customerGroup.findFirst({ where: { name: group.name } });
    if (!existing) {
      existing = await prisma.customerGroup.create({
        data: {
          name: group.name,
          reduction: group.reduction,
          showPrices: group.showPrices,
        },
      });
      console.log(`  ✅ Created group: ${group.name}`);
    } else {
      console.log(`  ⏭️  Group exists: ${group.name}`);
    }
    createdGroups.push(existing);
  }

  // Hash password once for all customers
  const password = await argon2.hash('customer123');

  // Create customers
  let created = 0;
  for (let i = 0; i < customersList.length; i++) {
    const customer = customersList[i];
    const existing = await prisma.customer.findUnique({ where: { email: customer.email } });

    if (!existing) {
      // Assign group based on index for variety
      const groupIndex = i < 10 ? 0 : i < 13 ? 1 : i < 14 ? 2 : 3;
      
      await prisma.customer.create({
        data: {
          email: customer.email,
          password,
          firstname: customer.firstname,
          lastname: customer.lastname,
          company: customer.company,
          birthday: customer.birthday,
          active: true,
          groupId: createdGroups[groupIndex].id,
        },
      });
      created++;
    }
  }

  console.log(`  ✅ Created ${created} new customers (${customersList.length - created} already existed)`);
  console.log('  📋 All customers use password: customer123');

  return createdGroups;
};
