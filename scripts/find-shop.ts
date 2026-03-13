import * as dotenv from 'dotenv';
import prisma from '../lib/db';

dotenv.config();

async function main() {
  const shop = await prisma.shop.findFirst();
  console.log('Shop Found:', shop ? shop.id : 'No shop found');
  if (shop) {
    console.log('Shop Domain:', shop.domain);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
