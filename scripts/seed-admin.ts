import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;

async function main() {
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({ adapter });

  const username = 'admin';
  const password = 'zicabella2026';

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
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
