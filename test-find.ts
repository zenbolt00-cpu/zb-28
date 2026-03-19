import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.product.findMany({
    where: { 
      OR: [
        { sku: { contains: 'ZB26', mode: 'insensitive' } },
        { barcode: { contains: 'ZB26', mode: 'insensitive' } },
        { title: { contains: 'GATEKEEPER', mode: 'insensitive' } }
      ]
    },
    include: { inventory: true }
  });
  console.log(JSON.stringify(p, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
