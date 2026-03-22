const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhone() {
  const number = "9222212222";
  const normalizedPhone = number;
  
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { phone: number },
        { phone: normalizedPhone },
        { phone: `+91${normalizedPhone}` },
        { phone: `+1${normalizedPhone}` },
        { phone: { contains: number } }
      ]
    },
    include: {
      orders: true
    }
  });

  console.log(JSON.stringify(customer, null, 2));
}

checkPhone().catch(console.error).finally(() => prisma.$disconnect());
