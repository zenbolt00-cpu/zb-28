import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const password = 'zicabella2026'; // The user-requested password

  console.log(`Seeding admin user: ${username}...`);

  await prisma.admin.upsert({
    where: { username },
    update: { password },
    create: {
      username,
      password,
    },
  });

  console.log('Admin user seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
