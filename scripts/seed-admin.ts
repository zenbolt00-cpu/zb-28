import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

let dbUrl = process.env.DATABASE_URL;

const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✔ Reading .env.local');
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  if (envConfig.DATABASE_URL) {
    dbUrl = envConfig.DATABASE_URL;
  }
} else {
  dotenv.config();
}

async function main() {
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL is not set');
    process.exit(1);
  }

  console.log(`📡 URL detect: ${dbUrl.substring(0, 10)}...`);

  let prisma: PrismaClient;
  let pool: Pool | undefined;

  try {
    if (dbUrl.trim().startsWith('file:')) {
      console.log('✔ Target: SQLite');
      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      prisma = new PrismaClient({ adapter: adapter as any });
    } else {
      console.log('✔ Target: PostgreSQL');
      pool = new Pool({ 
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });
      const adapter = new PrismaPg(pool as any);
      prisma = new PrismaClient({ adapter });
    }

    const username = 'admin';
    const password = 'ZICABELLA@2026';

    console.log(`🚀 Seeding admin: ${username}...`);

    await prisma.admin.upsert({
      where: { username },
      update: { password },
      create: {
        username,
        password,
      },
    });

    console.log('✅ Success.');
  } catch (err) {
    console.error('❌ Failed:', err);
    throw err;
  } finally {
    if (prisma!) await prisma.$disconnect();
    if (pool) await pool.end();
  }
}

main().catch((e) => {
  console.error('❌ FATAL:', e);
  process.exit(1);
});
