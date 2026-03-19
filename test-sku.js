const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.product.findFirst({
    where: { OR: [ { sku: { contains: 'ZB26', mode: 'insensitive' } }, { barcode: { contains: 'ZB26', mode: 'insensitive' } } ] }
  });
  console.log(p);
}
main().catch(console.error).finally(() => prisma.$disconnect());
