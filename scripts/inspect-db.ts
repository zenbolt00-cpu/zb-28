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
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  if (envConfig.DATABASE_URL) dbUrl = envConfig.DATABASE_URL;
}

async function main() {
  if (!dbUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  let prisma: PrismaClient;
  let pool: Pool | undefined;

  if (dbUrl.includes('postgres')) {
    pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(pool as any);
    prisma = new PrismaClient({ adapter });
  } else {
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });
    prisma = new PrismaClient({ adapter: adapter as any });
  }

  try {
    const shops = await prisma.shop.findMany();
    console.log('--- SHOPS ---');
    console.log(JSON.stringify(shops, null, 2));
    
    const admin = await prisma.admin.findFirst();
    console.log('\n--- ADMIN ---');
    console.log(admin ? `Found: ${admin.username}` : 'Not found');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma!.$disconnect();
    if (pool) await pool.end();
  }
}

main();
