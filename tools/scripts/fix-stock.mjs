
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Updating all stocks to 100...');
  
  await prisma.stock.updateMany({
    data: {
      quantity: 100
    }
  });

  console.log('Stock updated!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
