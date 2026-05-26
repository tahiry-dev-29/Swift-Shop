import { PrismaClient } from '@prisma/client';


export const seedCategories = async (prisma: PrismaClient) => {
  console.log('🗂️  Seeding Categories...');

  const categories = [
    { name: 'Électronique', description: 'Smartphones, tablettes, ordinateurs', position: 1 },
    { name: 'Mode', description: 'Vêtements, chaussures, accessoires', position: 2 },
    { name: 'Maison', description: 'Meubles, décoration, jardinage', position: 3 },
    { name: 'Sports', description: 'Équipements sportifs et loisirs', position: 4 },
    { name: 'Alimentation', description: 'Produits alimentaires et boissons', position: 5 },
  ];

  const createdCategories: { id: string; name: string }[] = [];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (!existing) {
      const created = await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          position: cat.position,
          active: true,
        },
      });
      createdCategories.push(created);
      console.log(`  ✅ Created: ${cat.name}`);
    } else {
      createdCategories.push(existing);
      console.log(`  ⏭️  Exists: ${cat.name}`);
    }
  }

  return createdCategories;
};


export const seedAttributes = async (prisma: PrismaClient) => {
  console.log('🎨 Seeding Attributes...');

  
  let sizeGroup = await prisma.attributeGroup.findFirst({ where: { name: 'Taille' } });
  if (!sizeGroup) {
    sizeGroup = await prisma.attributeGroup.create({
      data: {
        name: 'Taille',
        publicName: 'Taille',
        type: 'select',
        position: 1,
      },
    });
    
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    for (let i = 0; i < sizes.length; i++) {
      await prisma.attributeValue.create({
        data: {
          attributeGroupId: sizeGroup.id,
          name: sizes[i],
          position: i + 1,
        },
      });
    }
    console.log('  ✅ Created: Taille group with sizes');
  }

  
  let colorGroup = await prisma.attributeGroup.findFirst({ where: { name: 'Couleur' } });
  if (!colorGroup) {
    colorGroup = await prisma.attributeGroup.create({
      data: {
        name: 'Couleur',
        publicName: 'Couleur',
        type: 'color',
        position: 2,
      },
    });

    const colors = [
      { name: 'Noir', color: '#000000' },
      { name: 'Blanc', color: '#FFFFFF' },
      { name: 'Rouge', color: '#FF0000' },
      { name: 'Bleu', color: '#0000FF' },
      { name: 'Vert', color: '#00FF00' },
    ];

    for (let i = 0; i < colors.length; i++) {
      await prisma.attributeValue.create({
        data: {
          attributeGroupId: colorGroup.id,
          name: colors[i].name,
          color: colors[i].color,
          position: i + 1,
        },
      });
    }
    console.log('  ✅ Created: Couleur group with colors');
  }

  return { sizeGroup, colorGroup };
};



interface ProductDef {
  name: string;
  ref: string;
  price: number;
  category: string;
  hasCombinations?: boolean;
  description?: string;
}

export const seedProducts = async (
  prisma: PrismaClient,
  categories: { id: string; name: string }[]
) => {
  console.log('📦 Seeding Products...');

  const products: ProductDef[] = [
    { name: 'iPhone 15 Pro', ref: 'IPHONE15PRO', price: 1199, category: 'Électronique', description: 'Smartphone Apple dernière génération' },
    { name: 'MacBook Pro 14"', ref: 'MBP14', price: 2499, category: 'Électronique', description: 'Ordinateur portable professionnel Apple' },
    { name: 'Samsung Galaxy S24', ref: 'SGS24', price: 899, category: 'Électronique', description: 'Smartphone Android haut de gamme' },
    { name: 'iPad Air', ref: 'IPADAIR', price: 699, category: 'Électronique', description: 'Tablette Apple légère et performante' },
    { name: 'T-Shirt Basic', ref: 'TSHIRT01', price: 19.99, category: 'Mode', hasCombinations: true, description: 'T-shirt coton bio confortable' },
    { name: 'Jean Slim Fit', ref: 'JEANS01', price: 49.99, category: 'Mode', hasCombinations: true, description: 'Jean stretch coupe slim' },
    { name: 'Sneakers Runner', ref: 'SNEAK01', price: 89.99, category: 'Mode', hasCombinations: true, description: 'Chaussures de sport légères' },
    { name: 'Veste Cuir', ref: 'VEST01', price: 199.99, category: 'Mode', hasCombinations: true, description: 'Veste en cuir véritable' },
    { name: 'Canapé 3 Places', ref: 'CANAPE3P', price: 599, category: 'Maison', description: 'Canapé confortable 3 personnes' },
    { name: 'Table Basse Design', ref: 'TABLE01', price: 149, category: 'Maison', description: 'Table basse style scandinave' },
    { name: 'Lampe LED Smart', ref: 'LAMP01', price: 39.99, category: 'Maison', description: 'Lampe LED connectée RGB' },
    { name: 'Tapis Berbère', ref: 'TAPIS01', price: 129, category: 'Maison', description: 'Tapis artisanal berbère authentique' },
    { name: 'Vélo VTT Pro', ref: 'VTT01', price: 799, category: 'Sports', description: 'VTT tout suspendu 29 pouces' },
    { name: 'Raquette Tennis', ref: 'TENNIS01', price: 149, category: 'Sports', description: 'Raquette tennis carbone pro' },
    { name: 'Ballon Football', ref: 'FOOT01', price: 29.99, category: 'Sports', description: 'Ballon officiel taille 5' },
    { name: 'Tapis Yoga', ref: 'YOGA01', price: 24.99, category: 'Sports', description: 'Tapis yoga antidérapant 6mm' },
    { name: 'Café Premium 1kg', ref: 'CAFE01', price: 14.99, category: 'Alimentation', description: 'Café arabica torréfaction artisanale' },
    { name: 'Chocolat Noir 70%', ref: 'CHOCO01', price: 4.99, category: 'Alimentation', description: 'Chocolat noir premium 70% cacao' },
    { name: 'Huile Olive Extra', ref: 'OLIVE01', price: 12.99, category: 'Alimentation', description: 'Huile olive vierge extra bio' },
    { name: 'Vin Rouge AOC', ref: 'VIN01', price: 18.99, category: 'Alimentation', description: 'Vin rouge Bordeaux AOC 2020' },
  ];

  
  const sizeGroup = await prisma.attributeGroup.findFirst({ where: { name: 'Taille' } });
  const colorGroup = await prisma.attributeGroup.findFirst({ where: { name: 'Couleur' } });
  
  let sizes: { id: string; name: string }[] = [];
  let colors: { id: string; name: string }[] = [];

  if (sizeGroup) {
    sizes = await prisma.attributeValue.findMany({
      where: { attributeGroupId: sizeGroup.id },
      select: { id: true, name: true },
    });
  }

  if (colorGroup) {
    colors = await prisma.attributeValue.findMany({
      where: { attributeGroupId: colorGroup.id },
      select: { id: true, name: true },
    });
  }

  for (const prod of products) {
    const existing = await prisma.product.findFirst({
      where: { reference: prod.ref },
    });

    if (!existing) {
      const category = categories.find((c) => c.name === prod.category);
      const created = await prisma.product.create({
        data: {
          reference: prod.ref,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          wholesalePrice: prod.price * 0.6,
          active: true,
          availableForOrder: true,
          showPrice: true,
          categoryId: category?.id,
          weight: 0.5,
        },
      });

      
      if (prod.hasCombinations && sizes.length > 0 && colors.length > 0) {
        
        const selectedSizes = sizes.slice(1, 4); 
        const selectedColors = colors.slice(0, 3); 

        let isFirst = true;
        for (const size of selectedSizes) {
          for (const color of selectedColors) {
            const combination = await prisma.productCombination.create({
              data: {
                productId: created.id,
                reference: `${prod.ref}-${size.name}-${color.name}`,
                priceImpact: size.name === 'L' ? 5 : 0, 
                weightImpact: 0.1,
                active: true,
                isDefault: isFirst,
              },
            });

            
            await prisma.productCombinationAttribute.createMany({
              data: [
                { combinationId: combination.id, attributeValueId: size.id },
                { combinationId: combination.id, attributeValueId: color.id },
              ],
            });

            
            await prisma.stock.create({
              data: {
                combinationId: combination.id,
                quantity: Math.floor(Math.random() * 50) + 5,
                minQuantity: 3,
                outOfStockBehavior: 'deny',
              },
            });

            isFirst = false;
          }
        }
        console.log(`  ✅ Created: ${prod.name} (with ${selectedSizes.length * selectedColors.length} combinations)`);
      } else {
        
        await prisma.stock.create({
          data: {
            productId: created.id,
            quantity: Math.floor(Math.random() * 100) + 10,
            minQuantity: 5,
            outOfStockBehavior: 'deny',
          },
        });
        console.log(`  ✅ Created: ${prod.name}`);
      }
    } else {
      console.log(`  ⏭️  Exists: ${prod.name}`);
    }
  }
};
