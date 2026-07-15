import { PrismaClient } from '@swift-shop/prisma-client';

export const seedPricing = async (prisma: PrismaClient) => {
  console.log(
    '💰 Seeding Pricing Data (Countries, TaxRules, SpecificPrices)...',
  );

  const countries = [
    { isoCode: 'FR', name: 'France', taxRate: 20.0 },
    { isoCode: 'DE', name: 'Germany', taxRate: 19.0 },
    { isoCode: 'ES', name: 'Spain', taxRate: 21.0 },
    { isoCode: 'IT', name: 'Italy', taxRate: 22.0 },
    { isoCode: 'BE', name: 'Belgium', taxRate: 21.0 },
    { isoCode: 'US', name: 'United States', taxRate: 0.0 },
    { isoCode: 'GB', name: 'United Kingdom', taxRate: 20.0 },
    { isoCode: 'MG', name: 'Madagascar', taxRate: 20.0 },
  ];

  for (const country of countries) {
    const existing = await prisma.country.findUnique({
      where: { isoCode: country.isoCode },
    });

    if (!existing) {
      await prisma.country.create({
        data: country,
      });
      console.log(`  ✅ Created country: ${country.name}`);
    } else {
      console.log(`  ⏭️  Country exists: ${country.name}`);
    }
  }

  const frCountry = await prisma.country.findUnique({
    where: { isoCode: 'FR' },
  });
  if (frCountry) {
    const taxRules = [
      { name: 'TVA FR Standard (20%)', rate: 20.0 },
      { name: 'TVA FR Reduced (5.5%)', rate: 5.5 },
      { name: 'TVA FR Super Reduced (2.1%)', rate: 2.1 },
      { name: 'TVA FR Intermediate (10%)', rate: 10.0 },
    ];

    for (const rule of taxRules) {
      const existing = await prisma.taxRule.findFirst({
        where: {
          countryId: frCountry.id,
          name: rule.name,
        },
      });

      if (!existing) {
        await prisma.taxRule.create({
          data: {
            countryId: frCountry.id,
            name: rule.name,
            rate: rule.rate,
          },
        });
        console.log(`  ✅ Created Tax Rule: ${rule.name}`);
      }
    }
  }

  console.log('  📊 Creating Specific Prices...');

  const vipGroup = await prisma.customerGroup.findFirst({
    where: { name: 'VIP' },
  });
  const wholesaleGroup = await prisma.customerGroup.findFirst({
    where: { name: 'Wholesale' },
  });

  const products = await prisma.product.findMany({ take: 10 });

  if (products.length > 0) {
    const promo10 = await prisma.specificPrice.findFirst({
      where: {
        productId: products[0].id,
        reductionType: 'percentage',
        reduction: 10,
        customerId: null,
        customerGroupId: null,
      },
    });

    if (!promo10) {
      await prisma.specificPrice.create({
        data: {
          productId: products[0].id,
          reductionType: 'percentage',
          reduction: 10.0,
          priority: 1,
        },
      });
      console.log(`    ✅ 10% off on ${products[0].name}`);
    }

    if (vipGroup && products.length > 1) {
      const vipPromo = await prisma.specificPrice.findFirst({
        where: { productId: products[1].id, customerGroupId: vipGroup.id },
      });

      if (!vipPromo) {
        await prisma.specificPrice.create({
          data: {
            productId: products[1].id,
            customerGroupId: vipGroup.id,
            reductionType: 'percentage',
            reduction: 15.0,
            priority: 5,
          },
        });
        console.log(`    ✅ VIP 15% off on ${products[1].name}`);
      }
    }

    if (products.length > 2) {
      const qtyPromo = await prisma.specificPrice.findFirst({
        where: { productId: products[2].id, fromQuantity: 3 },
      });

      if (!qtyPromo) {
        await prisma.specificPrice.create({
          data: {
            productId: products[2].id,
            reductionType: 'amount',
            reduction: 5.0,
            fromQuantity: 3,
            priority: 2,
          },
        });
        console.log(`    ✅ 5€ off on ${products[2].name} (qty 3+)`);
      }
    }

    if (wholesaleGroup && products.length > 4) {
      for (let i = 3; i < Math.min(6, products.length); i++) {
        const wsPromo = await prisma.specificPrice.findFirst({
          where: {
            productId: products[i].id,
            customerGroupId: wholesaleGroup.id,
          },
        });

        if (!wsPromo) {
          await prisma.specificPrice.create({
            data: {
              productId: products[i].id,
              customerGroupId: wholesaleGroup.id,
              reductionType: 'percentage',
              reduction: 20.0,
              priority: 10,
            },
          });
          console.log(`    ✅ Wholesale 20% off on ${products[i].name}`);
        }
      }
    }

    if (products.length > 6) {
      const flashPromo = await prisma.specificPrice.findFirst({
        where: { productId: products[6].id, dateTo: { not: null } },
      });

      if (!flashPromo) {
        const now = new Date();
        const thirtyDaysLater = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000,
        );

        await prisma.specificPrice.create({
          data: {
            productId: products[6].id,
            reductionType: 'percentage',
            reduction: 25.0,
            dateFrom: now,
            dateTo: thirtyDaysLater,
            priority: 100,
          },
        });
        console.log(
          `    ✅ Flash sale 25% off on ${products[6].name} (30 days)`,
        );
      }
    }
  }

  console.log('  💱 Seeding Currencies...');
  const currencies = [
    {
      name: 'Euro',
      code: 'EUR',
      symbol: '€',
      exchangeRate: 1.0,
      isDefault: true,
    },
    {
      name: 'US Dollar',
      code: 'USD',
      symbol: '$',
      exchangeRate: 1.08,
      isDefault: false,
    },
    {
      name: 'Ariary',
      code: 'MGA',
      symbol: 'Ar',
      exchangeRate: 4900.0,
      isDefault: false,
    },
  ];
  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        name: currency.name,
        symbol: currency.symbol,
        exchangeRate: currency.exchangeRate,
        isDefault: currency.isDefault,
      },
      create: currency,
    });
  }

  console.log('  🌐 Seeding Languages...');
  const languages = [
    { name: 'Français', code: 'fr', locale: 'fr-FR', isDefault: true },
    { name: 'English', code: 'en', locale: 'en-US', isDefault: false },
    { name: 'Malagasy', code: 'mg', locale: 'mg-MG', isDefault: false },
  ];
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {
        name: language.name,
        locale: language.locale,
        isDefault: language.isDefault,
      },
      create: language,
    });
  }

  console.log('  🏬 Seeding default Store...');
  const defaultStore = await prisma.store.findFirst({
    where: { isDefault: true },
  });
  if (!defaultStore) {
    await prisma.store.create({
      data: {
        name: 'Swift Shop Madagascar',
        url: 'https://swiftshop.mg',
        active: true,
        isDefault: true,
      },
    });
  }
};
