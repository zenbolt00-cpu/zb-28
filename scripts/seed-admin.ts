import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;

async function main() {
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ 
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  const adapter = new PrismaPg(pool as any);
  const prisma = new PrismaClient({ adapter });

  try {
    const username = 'admin';
    const password = 'ZICABELLA@2026';

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
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  });
