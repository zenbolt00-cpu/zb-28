const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.admin.findUnique({ where: { username: 'admin' } });
    if (admin) {
      console.log('Username:', admin.username);
      console.log('Pass Hex:', Buffer.from(admin.password).toString('hex'));
      console.log('Target Hex:', Buffer.from('ZICABELLA@2026').toString('hex'));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
